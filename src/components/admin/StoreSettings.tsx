"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import { updateStoreSettings, saveShippingMethod, deleteShippingMethod } from "@/actions/settings";
import { CARRIERS } from "@/lib/constants";
import { countryName } from "@/lib/countries";

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  carrier: string | null;
  price: number;
  freeThreshold: number | null;
  minDays: number | null;
  maxDays: number | null;
  countries: string;
  isActive: boolean;
  sortOrder: number;
}

const blankMethod = {
  id: null as string | null,
  name: "",
  description: "",
  carrier: "ROYAL_MAIL",
  price: 3.95,
  freeThreshold: null as number | null,
  minDays: 2 as number | null,
  maxDays: 4 as number | null,
  countries: "GB",
  isActive: true,
  sortOrder: 0,
};

export function StoreSettings({
  settings,
  shippingMethods,
  squareConnected,
  emailConnected,
}: {
  settings: Record<string, string>;
  shippingMethods: ShippingMethod[];
  squareConnected: boolean;
  emailConnected: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const [store, setStore] = useState({
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    supportEmail: settings.supportEmail,
    freeShippingThreshold: Number(settings.freeShippingThreshold),
    taxRatePercent: Number(settings.taxRatePercent),
    taxIncludedInPrice: settings.taxIncludedInPrice === "true",
    lowStockThreshold: Number(settings.lowStockThreshold),
    orderPrefix: settings.orderPrefix,
  });

  const [editingMethod, setEditingMethod] = useState<typeof blankMethod | null>(null);

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setFeedback("");
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? (result.message ?? "Saved.") : (result.error ?? "That didn't work."));
      if (result.ok) {
        setEditingMethod(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-light">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Commercial rules that apply across the shop.
        </p>
      </div>

      {feedback && <p className="rounded-sm border bg-muted/40 p-3 text-sm">{feedback}</p>}

      {/* Integrations */}
      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-sm font-medium">Integrations</h2>
        <div className="space-y-3">
          <Integration
            name="Square payments"
            connected={squareConnected}
            hint="Set SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID and NEXT_PUBLIC_SQUARE_APPLICATION_ID to take cards."
          />
          <Integration
            name="Resend email"
            connected={emailConnected}
            hint="Set RESEND_API_KEY to send order confirmations and dispatch notices."
          />
        </div>
      </section>

      {/* Store */}
      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-sm font-medium">Store</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Store name">
            <Input
              value={store.storeName}
              onChange={(e) => setStore({ ...store, storeName: e.target.value })}
            />
          </Field>
          <Field label="Order number prefix" hint={`Orders look like ${store.orderPrefix}-2026-00001`}>
            <Input
              value={store.orderPrefix}
              onChange={(e) => setStore({ ...store, orderPrefix: e.target.value.toUpperCase() })}
              maxLength={6}
              className="font-mono uppercase"
            />
          </Field>
          <Field label="Orders email" hint="Appears as the sender on customer emails">
            <Input
              type="email"
              value={store.storeEmail}
              onChange={(e) => setStore({ ...store, storeEmail: e.target.value })}
            />
          </Field>
          <Field label="Support email" hint="Where customer replies go">
            <Input
              type="email"
              value={store.supportEmail}
              onChange={(e) => setStore({ ...store, supportEmail: e.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* Pricing rules */}
      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-sm font-medium">Pricing rules</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Free delivery over (£)" hint="Set 0 to switch free delivery off">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={store.freeShippingThreshold}
              onChange={(e) => setStore({ ...store, freeShippingThreshold: Number(e.target.value) })}
            />
          </Field>
          <Field label="VAT rate (%)" hint="Leave at 0 if you're not VAT registered">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={store.taxRatePercent}
              onChange={(e) => setStore({ ...store, taxRatePercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Low stock warning at">
            <Input
              type="number"
              min="0"
              value={store.lowStockThreshold}
              onChange={(e) => setStore({ ...store, lowStockThreshold: Number(e.target.value) })}
            />
          </Field>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={store.taxIncludedInPrice}
            onChange={(e) => setStore({ ...store, taxIncludedInPrice: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-foreground"
          />
          <span>
            Product prices already include VAT
            <span className="block text-xs text-muted-foreground">
              When ticked, nothing is added at checkout — the price on the tag is the price paid.
            </span>
          </span>
        </label>

        <Button
          size="sm"
          className="mt-5"
          disabled={pending}
          onClick={() => run(() => updateStoreSettings(store))}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save settings
        </Button>
      </section>

      {/* Delivery options */}
      <section className="rounded-md border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Delivery options</h2>
          {!editingMethod && (
            <Button size="sm" variant="outline" onClick={() => setEditingMethod({ ...blankMethod })}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>

        {editingMethod && (
          <div className="mb-4 rounded-sm border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={editingMethod.name}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  placeholder="Standard Delivery"
                  className="bg-background"
                />
              </Field>
              <Field label="Description">
                <Input
                  value={editingMethod.description}
                  onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                  placeholder="Royal Mail Tracked 48"
                  className="bg-background"
                />
              </Field>
              <Field label="Price (£)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingMethod.price}
                  onChange={(e) => setEditingMethod({ ...editingMethod, price: Number(e.target.value) })}
                  className="bg-background"
                />
              </Field>
              <Field label="Carrier">
                <select
                  value={editingMethod.carrier}
                  onChange={(e) => setEditingMethod({ ...editingMethod, carrier: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fastest (days)">
                <Input
                  type="number"
                  min="0"
                  value={editingMethod.minDays ?? ""}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      minDays: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="bg-background"
                />
              </Field>
              <Field label="Slowest (days)">
                <Input
                  type="number"
                  min="0"
                  value={editingMethod.maxDays ?? ""}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      maxDays: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="bg-background"
                />
              </Field>
              <Field label="Countries" hint="Comma separated ISO codes, or * for anywhere">
                <Input
                  value={editingMethod.countries}
                  onChange={(e) => setEditingMethod({ ...editingMethod, countries: e.target.value })}
                  className="bg-background uppercase"
                />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  min="0"
                  value={editingMethod.sortOrder}
                  onChange={(e) => setEditingMethod({ ...editingMethod, sortOrder: Number(e.target.value) })}
                  className="bg-background"
                />
              </Field>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editingMethod.isActive}
                onChange={(e) => setEditingMethod({ ...editingMethod, isActive: e.target.checked })}
                className="h-4 w-4 accent-foreground"
              />
              Offer this option at checkout
            </label>

            <div className="mt-4 flex gap-2">
              <Button size="sm" disabled={pending} onClick={() => run(() => saveShippingMethod(editingMethod))}>
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save option
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingMethod(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="divide-y rounded-sm border">
          {shippingMethods.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No delivery options — checkout will fall back to built-in defaults.
            </p>
          ) : (
            shippingMethods.map((method) => (
              <div key={method.id} className="flex items-center gap-3 p-3">
                <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {method.name}
                    {!method.isActive && (
                      <span className="ml-2 text-xs text-muted-foreground">(hidden)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      method.description,
                      describeCoverage(method.countries),
                      method.minDays && method.maxDays ? `${method.minDays}–${method.maxDays} days` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="text-sm">
                  {method.price === 0 ? "Free" : formatMoney(method.price)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setEditingMethod({
                      id: method.id,
                      name: method.name,
                      description: method.description ?? "",
                      carrier: method.carrier ?? "ROYAL_MAIL",
                      price: method.price,
                      freeThreshold: method.freeThreshold,
                      minDays: method.minDays,
                      maxDays: method.maxDays,
                      countries: method.countries,
                      isActive: method.isActive,
                      sortOrder: method.sortOrder,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => run(() => deleteShippingMethod(method.id))}
                  className="text-destructive hover:text-destructive"
                  aria-label={`Remove ${method.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * A zone can list thirty country codes; printing them all makes the settings
 * list unreadable, so summarise anything longer than a few.
 */
function describeCoverage(countries: string): string {
  const codes = countries
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (codes.includes("*")) return "Worldwide";
  if (codes.length === 0) return "";
  if (codes.length <= 3) return codes.map(countryName).join(", ");
  return `${codes.length} countries`;
}

function Integration({
  name,
  connected,
  hint,
}: {
  name: string;
  connected: boolean;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          connected ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"
        }`}
      >
        {connected && <Check className="h-2.5 w-2.5 text-emerald-600" />}
      </span>
      <div>
        <p className="text-sm">
          {name}
          <span className={`ml-2 text-xs ${connected ? "text-emerald-600" : "text-muted-foreground"}`}>
            {connected ? "connected" : "not connected"}
          </span>
        </p>
        {!connected && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
