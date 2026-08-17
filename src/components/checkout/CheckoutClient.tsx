"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Check, Globe, Loader2, Lock, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore, cartLineKey, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { countriesByRegion, countryName, isPostcodeRequired, HOME_COUNTRY } from "@/lib/countries";
import { quoteCheckout, placeOrder, type QuoteResult } from "@/actions/checkout";
import { SquareCardForm, type SquareCardFormHandle } from "./SquareCardForm";

interface SavedAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  isDefault: boolean;
}

interface Props {
  squareConfig: { applicationId: string; locationId: string; environment: string; enabled: boolean };
  user: { email: string; name: string | null; phone: string | null } | null;
  savedAddresses: SavedAddress[];
}

const emptyAddress = {
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
  country: HOME_COUNTRY,
  phone: "",
};

type AddressForm = typeof emptyAddress;

export function CheckoutClient({ squareConfig, user, savedAddresses }: Props) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // The cart lives in localStorage, so the first server render has nothing.
  // Waiting for hydration keeps server and client markup consistent.
  const mounted = useHydrated();

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState<AddressForm>(
    defaultAddress
      ? {
          firstName: defaultAddress.firstName,
          lastName: defaultAddress.lastName,
          line1: defaultAddress.line1,
          line2: defaultAddress.line2 ?? "",
          city: defaultAddress.city,
          county: defaultAddress.county ?? "",
          postcode: defaultAddress.postcode,
          country: defaultAddress.country,
          phone: defaultAddress.phone ?? "",
        }
      : { ...emptyAddress, ...splitName(user?.name) }
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id ?? null);

  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressForm>({ ...emptyAddress });

  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, startSubmit] = useTransition();
  const [cardReady, setCardReady] = useState(false);

  const cardRef = useRef<SquareCardFormHandle>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const cartKey = useMemo(
    () => items.map((i) => `${cartLineKey(i)}:${i.quantity}`).join("|"),
    [items]
  );

  /**
   * The server prices by product, but the cart can hold several lines for the
   * same product (a bespoke design and a stock piece). Quantities are summed
   * per product so stock checks and totals stay correct.
   */
  const orderLines = useMemo(() => {
    const byProduct = new Map<string, number>();
    for (const item of items) {
      byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
    }
    return [...byProduct].map(([productId, quantity]) => ({ productId, quantity }));
  }, [items]);

  /** Drop or trim every cart line that draws on a given product. */
  const reconcileProduct = useCallback(
    (productId: string, availableQuantity: number | undefined) => {
      const affected = items.filter((i: CartItem) => i.productId === productId);
      if (affected.length === 0) return;

      if (!availableQuantity) {
        for (const line of affected) removeItem(cartLineKey(line));
        return;
      }

      // Give the available stock to the earliest lines and drop the rest.
      let left = availableQuantity;
      for (const line of affected) {
        const keep = Math.min(line.quantity, left);
        left -= keep;
        if (keep <= 0) removeItem(cartLineKey(line));
        else if (keep !== line.quantity) updateQuantity(cartLineKey(line), keep);
      }
    },
    [items, removeItem, updateQuantity]
  );

  /** Re-price whenever the basket, destination or delivery choice changes. */
  const refreshQuote = useCallback(async () => {
    if (!mounted || items.length === 0) {
      setQuote(null);
      return;
    }

    setQuoting(true);
    try {
      const result = await quoteCheckout({
        items: orderLines,
        shippingMethodId,
        discountCode: appliedCode,
        country: address.country,
        email: email || null,
      });

      setQuote(result);

      // Adopt the server's choice when we have none, and re-sync when the
      // current pick no longer serves the destination — otherwise changing
      // country leaves a selection that isn't in the list any more.
      const stillOffered = result.shippingOptions.some((o) => o.id === shippingMethodId);
      if (result.selectedShippingId && (!shippingMethodId || !stillOffered)) {
        setShippingMethodId(result.selectedShippingId);
      }

      // A code that stopped qualifying (basket shrank, expired) is dropped.
      if (appliedCode && result.discount && !result.discount.valid) {
        setAppliedCode(null);
        setFormError(result.discount.reason ?? "That discount code is no longer valid.");
      }

      // Reconcile the local cart with what the server says is actually buyable.
      for (const issue of result.issues) {
        reconcileProduct(
          issue.productId,
          issue.type === "UNAVAILABLE" ? 0 : issue.availableQuantity
        );
      }
    } finally {
      setQuoting(false);
    }
  }, [mounted, items.length, orderLines, shippingMethodId, appliedCode, address.country, email, reconcileProduct]);

  useEffect(() => {
    const timer = setTimeout(refreshQuote, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, shippingMethodId, appliedCode, address.country, mounted]);

  function updateAddress(field: keyof AddressForm, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setSelectedAddressId(null);
    setErrors((prev) => ({ ...prev, [`shippingAddress.${field}`]: "" }));
  }

  function applySavedAddress(saved: SavedAddress) {
    setAddress({
      firstName: saved.firstName,
      lastName: saved.lastName,
      line1: saved.line1,
      line2: saved.line2 ?? "",
      city: saved.city,
      county: saved.county ?? "",
      postcode: saved.postcode,
      country: saved.country,
      phone: saved.phone ?? "",
    });
    setSelectedAddressId(saved.id);
  }

  async function applyDiscount() {
    const code = discountInput.trim();
    if (!code) return;
    setFormError("");
    setAppliedCode(code.toUpperCase());
    setDiscountInput("");
  }

  function removeDiscount() {
    setAppliedCode(null);
    setFormError("");
  }

  function scrollToError() {
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setErrors({});

    if (!quote || quote.lines.length === 0) {
      setFormError("Your basket is empty.");
      return;
    }

    startSubmit(async () => {
      let sourceId: string | undefined;
      let verificationToken: string | undefined;

      // Tokenise first: no point creating an order if the card is unreadable.
      if (squareConfig.enabled) {
        const tokenResult = await cardRef.current?.tokenize({
          amount: quote.total.toFixed(2),
          billingContact: {
            givenName: (billingSame ? address : billing).firstName,
            familyName: (billingSame ? address : billing).lastName,
            email,
            phone: phone || undefined,
            addressLines: [
              (billingSame ? address : billing).line1,
              (billingSame ? address : billing).line2,
            ].filter(Boolean) as string[],
            city: (billingSame ? address : billing).city,
            state: (billingSame ? address : billing).county,
            postalCode: (billingSame ? address : billing).postcode,
            countryCode: (billingSame ? address : billing).country,
          },
        });

        if (!tokenResult?.ok) {
          setFormError(tokenResult?.error ?? "Please check your card details.");
          scrollToError();
          return;
        }

        sourceId = tokenResult.token;
        verificationToken = tokenResult.verificationToken;
      }

      const result = await placeOrder({
        items: orderLines,
        email,
        phone,
        shippingAddress: address,
        billingAddress: billingSame ? null : billing,
        billingSameAsShipping: billingSame,
        shippingMethodId: shippingMethodId ?? quote.selectedShippingId ?? "",
        discountCode: appliedCode,
        notes,
        giftMessage: showGift ? giftMessage : "",
        marketingOptIn,
        sourceId,
        verificationToken,
      });

      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.issues?.length) await refreshQuote();
        scrollToError();
        return;
      }

      clearCart();
      const query = new URLSearchParams({ order: result.orderNumber });
      if (result.guestToken) query.set("token", result.guestToken);
      router.push(`/checkout/confirmation?${query.toString()}`);
    });
  }

  if (!mounted) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-6 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-3 font-heading text-3xl font-light">Nothing to check out</h1>
        <p className="mb-8 text-muted-foreground">Your bag is empty.</p>
        <Button asChild>
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  const lines = quote?.lines ?? [];
  const disabled =
    submitting ||
    quoting ||
    !quote ||
    quote.lines.length === 0 ||
    // Nothing to pay for if we can't get the parcel there.
    !quote.shipsToCountry;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="mb-10 font-heading text-3xl font-light lg:text-4xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-5 lg:gap-16">
        <div className="space-y-10 lg:col-span-3">
          {(formError || quote?.issues.length) && (
            <div ref={errorRef} className="space-y-2">
              {formError && (
                <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {quote?.issues.map((issue) => (
                <div
                  key={`${issue.productId}-${issue.type}`}
                  className="flex items-start gap-2 rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contact */}
          <section>
            <SectionHeading step={1}>Contact</SectionHeading>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" error={errors.email} className="sm:col-span-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  readOnly={Boolean(user?.email)}
                />
              </Field>
              <Field label="Phone (optional)" hint="For delivery updates">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </Field>
            </div>
            {!user && (
              <p className="mt-3 text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin?callbackUrl=/checkout" className="underline hover:text-foreground">
                  Sign in
                </Link>{" "}
                for faster checkout.
              </p>
            )}
          </section>

          {/* Delivery address */}
          <section>
            <SectionHeading step={2}>Delivery address</SectionHeading>

            {savedAddresses.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {savedAddresses.map((saved) => (
                  <button
                    key={saved.id}
                    type="button"
                    onClick={() => applySavedAddress(saved)}
                    className={`rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                      selectedAddressId === saved.id
                        ? "border-foreground bg-accent"
                        : "hover:border-foreground/40"
                    }`}
                  >
                    <span className="block font-medium">{saved.label}</span>
                    <span className="text-muted-foreground">
                      {saved.line1}, {saved.postcode}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <AddressFields value={address} onChange={updateAddress} errors={errors} prefix="shippingAddress" />
          </section>

          {/* Delivery method */}
          <section>
            <SectionHeading step={3}>Delivery method</SectionHeading>
            <div className="space-y-2">
              {quote && !quote.shipsToCountry ? (
                <div className="rounded-sm border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="mb-1 font-medium">
                    We don&apos;t deliver to {countryName(address.country)} yet
                  </p>
                  <p className="text-muted-foreground">
                    Choose a different country, or{" "}
                    <Link href="/pages/contact" className="underline hover:text-foreground">
                      email us
                    </Link>{" "}
                    — we can often arrange something for a single order.
                  </p>
                </div>
              ) : quote?.shippingOptions.length ? (
                quote.shippingOptions.map((option) => {
                  const active = (shippingMethodId ?? quote.selectedShippingId) === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-sm border p-4 transition-colors ${
                        active ? "border-foreground bg-accent/50" : "hover:border-foreground/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={active}
                        onChange={() => setShippingMethodId(option.id)}
                        className="h-4 w-4 accent-foreground"
                      />
                      <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{option.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {[option.description, option.estimate].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="text-sm font-medium">
                        {option.effectivePrice === 0 ? "Free" : formatMoney(option.effectivePrice)}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Loading delivery options…</p>
              )}
            </div>

            {quote?.customsApplies && quote.shipsToCountry && (
              <div className="mt-3 flex items-start gap-2 rounded-sm border bg-muted/40 p-3 text-xs text-muted-foreground">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Delivery to {countryName(address.country)} is sent from the UK. Import duty or
                  local tax may be charged on arrival and is paid by you — it isn&apos;t included
                  in this order. Customs clearance can add time to the estimates above.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <Field label="Delivery notes (optional)">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Leave with a neighbour, safe place…"
                  maxLength={500}
                />
              </Field>

              <button
                type="button"
                onClick={() => setShowGift((v) => !v)}
                className="text-xs underline text-muted-foreground hover:text-foreground"
              >
                {showGift ? "Remove gift message" : "This is a gift — add a message"}
              </button>

              {showGift && (
                <Field label="Gift message" hint="Handwritten on a card, no prices included">
                  <Textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    rows={3}
                    maxLength={300}
                  />
                </Field>
              )}
            </div>
          </section>

          {/* Payment */}
          <section>
            <SectionHeading step={4}>Payment</SectionHeading>

            {squareConfig.enabled ? (
              <>
                <SquareCardForm
                  ref={cardRef}
                  applicationId={squareConfig.applicationId}
                  locationId={squareConfig.locationId}
                  environment={squareConfig.environment}
                  onReadyChange={setCardReady}
                />

                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                    className="h-4 w-4 accent-foreground"
                  />
                  Billing address is the same as delivery
                </label>

                {!billingSame && (
                  <div className="mt-4">
                    <AddressFields
                      value={billing}
                      onChange={(field, value) => setBilling((prev) => ({ ...prev, [field]: value }))}
                      errors={errors}
                      prefix="billingAddress"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-sm border border-dashed p-4 text-sm text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Card payment isn&apos;t connected yet</p>
                <p>
                  Your order will be placed as awaiting payment and we&apos;ll email you to arrange it.
                  Nothing is charged now.
                </p>
              </div>
            )}
          </section>

          <div className="hidden lg:block">
            <SubmitButton
              disabled={disabled || (squareConfig.enabled && !cardReady)}
              submitting={submitting}
              total={quote?.total ?? 0}
              paymentEnabled={squareConfig.enabled}
            />
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-2">
          <div className="sticky top-28 rounded-sm border bg-muted/30 p-6">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em]">Order summary</h2>

            <div className="mb-5 space-y-4">
              {lines.map((line) => (
                <div key={line.productId} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-background">
                    {line.image ? (
                      <Image src={line.image} alt={line.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{line.title}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(line.unitPrice)} each</p>
                  </div>
                  <p className="text-sm">{formatMoney(line.totalPrice)}</p>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="mb-5 border-t pt-4">
              {appliedCode && quote?.discount?.valid ? (
                <div className="flex items-center justify-between rounded-sm bg-background p-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-mono text-xs">{appliedCode}</span>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove discount"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="Discount code"
                    className="h-9 text-sm uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyDiscount();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-9" onClick={applyDiscount}>
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatMoney(quote?.subtotal ?? 0)} />
              {(quote?.discountAmount ?? 0) > 0 && (
                <Row
                  label={`Discount${appliedCode ? ` (${appliedCode})` : ""}`}
                  value={`−${formatMoney(quote!.discountAmount)}`}
                  accent
                />
              )}
              <Row
                label="Delivery"
                value={
                  quote?.shippingCost === 0 ? "Free" : formatMoney(quote?.shippingCost ?? 0)
                }
              />
              {(quote?.taxAmount ?? 0) > 0 && <Row label="VAT" value={formatMoney(quote!.taxAmount)} />}

              <div className="flex justify-between border-t pt-3 text-base font-medium">
                <span>Total</span>
                <span className="flex items-center gap-2">
                  {quoting && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  {formatMoney(quote?.total ?? 0)}
                </span>
              </div>

              {quote?.customsApplies && (
                <p className="pt-1 text-xs text-muted-foreground">
                  Charged in pounds sterling. Your bank converts at its own rate and may add a
                  foreign transaction fee.
                </p>
              )}
            </div>

            {(quote?.freeShippingRemaining ?? 0) > 0 && (
              <p className="mt-4 rounded-sm bg-background p-3 text-xs text-muted-foreground">
                Spend {formatMoney(quote!.freeShippingRemaining)} more for free delivery.
              </p>
            )}

            <label className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-foreground"
              />
              Email me occasionally about new pieces. No spam, unsubscribe anytime.
            </label>

            <div className="mt-6 lg:hidden">
              <SubmitButton
                disabled={disabled || (squareConfig.enabled && !cardReady)}
                submitting={submitting}
                total={quote?.total ?? 0}
                paymentEnabled={squareConfig.enabled}
              />
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SubmitButton({
  disabled,
  submitting,
  total,
  paymentEnabled,
}: {
  disabled: boolean;
  submitting: boolean;
  total: number;
  paymentEnabled: boolean;
}) {
  return (
    <>
      <Button
        type="submit"
        disabled={disabled || submitting}
        className="h-12 w-full text-xs uppercase tracking-[0.2em]"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            {paymentEnabled ? `Pay ${formatMoney(total)}` : `Place order — ${formatMoney(total)}`}
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        By placing this order you agree to our{" "}
        <Link href="/pages/terms" className="underline hover:text-foreground">
          terms
        </Link>
        .
      </p>
    </>
  );
}

function SectionHeading({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.15em]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
        {step}
      </span>
      {children}
    </h2>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-emerald-600" : undefined}>{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function AddressFields({
  value,
  onChange,
  errors,
  prefix,
}: {
  value: AddressForm;
  onChange: (field: keyof AddressForm, value: string) => void;
  errors: Record<string, string>;
  prefix: string;
}) {
  // Several destinations have no postal code system at all.
  const postcodeRequired = isPostcodeRequired(value.country);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="First name" error={errors[`${prefix}.firstName`]}>
        <Input
          value={value.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
          autoComplete="given-name"
          required
        />
      </Field>
      <Field label="Last name" error={errors[`${prefix}.lastName`]}>
        <Input
          value={value.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
          autoComplete="family-name"
          required
        />
      </Field>
      <Field label="Address" error={errors[`${prefix}.line1`]} className="col-span-2">
        <Input
          value={value.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          autoComplete="address-line1"
          required
        />
      </Field>
      <Field label="Apartment, suite (optional)" className="col-span-2">
        <Input
          value={value.line2}
          onChange={(e) => onChange("line2", e.target.value)}
          autoComplete="address-line2"
        />
      </Field>
      <Field label="City" error={errors[`${prefix}.city`]}>
        <Input
          value={value.city}
          onChange={(e) => onChange("city", e.target.value)}
          autoComplete="address-level2"
          required
        />
      </Field>
      <Field label="County (optional)">
        <Input
          value={value.county}
          onChange={(e) => onChange("county", e.target.value)}
          autoComplete="address-level1"
        />
      </Field>
      <Field
        label={postcodeRequired ? "Postcode" : "Postcode (optional)"}
        error={errors[`${prefix}.postcode`]}
      >
        <Input
          value={value.postcode}
          onChange={(e) => onChange("postcode", e.target.value.toUpperCase())}
          autoComplete="postal-code"
          required={postcodeRequired}
        />
      </Field>
      <Field label="Country" error={errors[`${prefix}.country`]}>
        <select
          value={value.country}
          onChange={(e) => onChange("country", e.target.value)}
          autoComplete="country"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {countriesByRegion().map((group) => (
            <optgroup key={group.region} label={group.region}>
              {group.countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
    </div>
  );
}

function splitName(name?: string | null): { firstName: string; lastName: string } {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}
