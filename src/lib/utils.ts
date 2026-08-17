import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The designer engine prices everything in integer cents to avoid float drift
// across hundreds of per-bead sums; the storefront stores pounds as Float.
// Convert at the boundary with `centsToPounds` when handing a design to the cart.
export function formatCents(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    cents / 100,
  )
}

export function centsToPounds(cents: number): number {
  return Math.round(cents) / 100
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
