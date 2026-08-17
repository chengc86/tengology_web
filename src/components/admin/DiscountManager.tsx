"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pause, Play, Plus, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import { saveDiscountCode, toggleDiscountCode, deleteDiscountCode } from "@/actions/discounts";

interface Discount {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minSubtotal: number | null;
  maxRedemptions: number | null;
  perCustomerLimit: number | null;
  timesRedeemed: number;
  isActive: boolean;
  endsAt: Date | null;
}

const blank = {
  id: null as string | null,
  code: "",
  description: "",
  type: "PERCENT" as "PERCENT" | "FIXED" | "FREE_SHIPPING",
  value: 10,
  minSubtotal: null as number | null,
  maxRedemptions: null as number | null,
  perCustomerLimit: null as number | null,
  isActive: true,
  endsAt: null as string | null,
};

export function DiscountManager({ discounts }: { discounts: Discount[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<typeof blank | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> }>) {
    setErrors({});
    setFeedback("");
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setFeedback(result.message ?? "Saved.");
        setEditing(null);
        router.refresh();
      } else {
        setFeedback(result.error ?? "That didn't work.");
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    });
  }

  function describe(discount: Discount): string {
    if (discount.type === "PERCENT") return `${discount.value}% off`;
    if (discount.type === "FIXED") return `${formatMoney(discount.value)} off`;
    return "Free delivery";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light">Discount codes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Codes shoppers can enter at checkout.
          </p>
        </div>
        {!editing && (
          <Button size="sm" onClick={() => setEditing({ ...blank })}>
            <Plus className="h-3.5 w-3.5" />
            New code
          </Button>
        )}
      </div>

      {feedback && (
        <p className="mb-4 rounded-sm border bg-muted/40 p-3 text-sm">{feedback}</p>
      )}

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveDiscountCode(editing));
          }}
          className="mb-6 rounded-md border p-5"
        >
          <h2 className="mb-4 text-sm font-medium">{editing.id ? "Edit code" : "New code"}</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Code" error={errors.code}>
              <Input
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                className="font-mono uppercase"
                required
              />
            </Field>

            <Field label="Type">
              <select
                value={editing.type}
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value as typeof editing.type })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PERCENT">Percentage off</option>
                <option value="FIXED">Fixed amount off</option>
                <option value="FREE_SHIPPING">Free delivery</option>
              </select>
            </Field>

            {editing.type !== "FREE_SHIPPING" && (
              <Field
                label={editing.type === "PERCENT" ? "Percent off" : "Amount off (£)"}
                error={errors.value}
              >
                <Input
                  type="number"
                  step={editing.type === "PERCENT" ? "1" : "0.01"}
                  min="0"
                  max={editing.type === "PERCENT" ? "100" : undefined}
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                  required
                />
              </Field>
            )}

            <Field label="Description" className="sm:col-span-2">
              <Input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="10% off your first order"
              />
            </Field>

            <Field label="Minimum spend (£)">
              <NumberInput
                value={editing.minSubtotal}
                onChange={(v) => setEditing({ ...editing, minSubtotal: v })}
                placeholder="No minimum"
              />
            </Field>

            <Field label="Total uses">
              <NumberInput
                value={editing.maxRedemptions}
                onChange={(v) => setEditing({ ...editing, maxRedemptions: v })}
                placeholder="Unlimited"
              />
            </Field>

            <Field label="Uses per customer">
              <NumberInput
                value={editing.perCustomerLimit}
                onChange={(v) => setEditing({ ...editing, perCustomerLimit: v })}
                placeholder="Unlimited"
              />
            </Field>

            <Field label="Expires">
              <Input
                type="date"
                value={editing.endsAt ?? ""}
                onChange={(e) => setEditing({ ...editing, endsAt: e.target.value || null })}
              />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.isActive}
              onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              className="h-4 w-4 accent-foreground"
            />
            Active
          </label>

          <div className="mt-5 flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save code
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {discounts.length === 0 && !editing ? (
        <div className="rounded-md border py-16 text-center">
          <Ticket className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="mb-4 text-sm text-muted-foreground">No discount codes yet.</p>
          <Button size="sm" onClick={() => setEditing({ ...blank })}>
            Create your first code
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Discount</th>
                <th className="p-3 font-medium">Conditions</th>
                <th className="p-3 font-medium">Used</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((discount) => (
                <tr key={discount.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-3">
                    <span className="font-mono text-sm">{discount.code}</span>
                    {discount.description && (
                      <span className="block text-xs text-muted-foreground">{discount.description}</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">{describe(discount)}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {discount.minSubtotal ? <div>Min {formatMoney(discount.minSubtotal)}</div> : null}
                    {discount.perCustomerLimit ? <div>{discount.perCustomerLimit} per customer</div> : null}
                    {discount.endsAt ? (
                      <div>Ends {discount.endsAt.toLocaleDateString("en-GB")}</div>
                    ) : null}
                    {!discount.minSubtotal && !discount.perCustomerLimit && !discount.endsAt && "—"}
                  </td>
                  <td className="p-3 text-sm">
                    {discount.timesRedeemed}
                    {discount.maxRedemptions ? ` / ${discount.maxRedemptions}` : ""}
                  </td>
                  <td className="p-3">
                    {discount.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Paused</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          setEditing({
                            id: discount.id,
                            code: discount.code,
                            description: discount.description ?? "",
                            type: discount.type as typeof blank.type,
                            value: discount.value,
                            minSubtotal: discount.minSubtotal,
                            maxRedemptions: discount.maxRedemptions,
                            perCustomerLimit: discount.perCustomerLimit,
                            isActive: discount.isActive,
                            endsAt: discount.endsAt
                              ? discount.endsAt.toISOString().slice(0, 10)
                              : null,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => run(() => toggleDiscountCode(discount.id))}
                        aria-label={discount.isActive ? "Pause code" : "Activate code"}
                      >
                        {discount.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => run(() => deleteDiscountCode(discount.id))}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete code"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
}) {
  return (
    <Input
      type="number"
      step="0.01"
      min="0"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
