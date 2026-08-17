"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAddress, deleteAddress, setDefaultAddress } from "@/actions/account";
import { countriesByRegion, countryName, isPostcodeRequired, HOME_COUNTRY } from "@/lib/countries";

interface Address {
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

const blank = {
  id: null as string | null,
  label: "Home",
  firstName: "",
  lastName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
  country: HOME_COUNTRY,
  isDefault: false,
};

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<typeof blank | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit(address: Address) {
    setErrors({});
    setFormError("");
    setEditing({
      id: address.id,
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      county: address.county ?? "",
      postcode: address.postcode,
      country: address.country,
      isDefault: address.isDefault,
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setErrors({});
    setFormError("");

    startTransition(async () => {
      const result = await saveAddress(editing);
      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteAddress(id);
      router.refresh();
    });
  }

  function makeDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddress(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-light">Addresses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved addresses fill in your checkout automatically.
          </p>
        </div>
        {!editing && (
          <Button size="sm" onClick={() => setEditing({ ...blank })}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {editing && (
        <form onSubmit={submit} className="mb-6 rounded-sm border p-5">
          <h2 className="mb-4 text-sm font-medium">
            {editing.id ? "Edit address" : "New address"}
          </h2>

          {formError && <p className="mb-3 text-sm text-destructive">{formError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Label" className="col-span-2" error={errors.label}>
              <Input
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                placeholder="Home, Work…"
              />
            </Field>
            <Field label="First name" error={errors.firstName}>
              <Input
                value={editing.firstName}
                onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                required
              />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <Input
                value={editing.lastName}
                onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                required
              />
            </Field>
            <Field label="Address" className="col-span-2" error={errors.line1}>
              <Input
                value={editing.line1}
                onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
                required
              />
            </Field>
            <Field label="Apartment, suite (optional)" className="col-span-2">
              <Input
                value={editing.line2}
                onChange={(e) => setEditing({ ...editing, line2: e.target.value })}
              />
            </Field>
            <Field label="City" error={errors.city}>
              <Input
                value={editing.city}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                required
              />
            </Field>
            <Field label="County (optional)">
              <Input
                value={editing.county}
                onChange={(e) => setEditing({ ...editing, county: e.target.value })}
              />
            </Field>
            <Field
              label={isPostcodeRequired(editing.country) ? "Postcode" : "Postcode (optional)"}
              error={errors.postcode}
            >
              <Input
                value={editing.postcode}
                onChange={(e) => setEditing({ ...editing, postcode: e.target.value.toUpperCase() })}
                required={isPostcodeRequired(editing.country)}
              />
            </Field>
            <Field label="Country" error={errors.country}>
              <select
                value={editing.country}
                onChange={(e) => setEditing({ ...editing, country: e.target.value })}
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
            <Field label="Phone (optional)">
              <Input
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                type="tel"
              />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.isDefault}
              onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
              className="h-4 w-4 accent-foreground"
            />
            Use as my default address
          </label>

          <div className="mt-5 flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save address
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !editing ? (
        <div className="rounded-sm border py-14 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="mb-4 text-sm text-muted-foreground">No saved addresses yet.</p>
          <Button size="sm" onClick={() => setEditing({ ...blank })}>
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-sm border p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium">{address.label}</span>
                {address.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    <Check className="h-2.5 w-2.5" />
                    Default
                  </span>
                )}
              </div>

              <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                {address.firstName} {address.lastName}
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city}
                {address.county && `, ${address.county}`}
                {address.postcode && (
                  <>
                    <br />
                    {address.postcode}
                  </>
                )}
                <br />
                {countryName(address.country)}
              </address>

              <div className="mt-3 flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(address)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                {!address.isDefault && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => makeDefault(address.id)} disabled={pending}>
                      Make default
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(address.id)}
                      disabled={pending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
