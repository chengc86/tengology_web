import { z } from "zod";
import { HOME_COUNTRY, isPostcodeRequired, isSupportedCountry } from "./countries";

/**
 * Input schemas shared by server actions and route handlers.
 * Everything crossing the network boundary is parsed here first —
 * server actions are reachable by direct POST, not just through our own UI.
 */

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

/**
 * A postal address anywhere we ship to.
 *
 * The postcode rule is per-country: plenty of destinations (the UAE, Hong Kong,
 * Panama) simply don't use them, and demanding one there makes checkout
 * impossible to complete honestly.
 */
const addressFields = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  line1: z.string().trim().min(1, "Address is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  county: z.string().trim().max(100).optional().or(z.literal("")),
  postcode: z.string().trim().max(16).optional().or(z.literal("")),
  country: z
    .string()
    .trim()
    .length(2)
    .default(HOME_COUNTRY)
    .refine(isSupportedCountry, { message: "We don't ship to that country yet" }),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

/** Shared so the saved-address form enforces the same per-country rule. */
function requirePostcodeWhereUsed(
  address: { country: string; postcode?: string },
  ctx: z.RefinementCtx
) {
  if (isPostcodeRequired(address.country) && !address.postcode?.trim()) {
    ctx.addIssue({ code: "custom", path: ["postcode"], message: "Postcode is required" });
  }
}

export const addressSchema = addressFields.superRefine(requirePostcodeWhereUsed);

export type AddressInput = z.infer<typeof addressSchema>;

export const quoteSchema = z.object({
  items: z.array(cartLineSchema).max(50),
  shippingMethodId: z.string().nullish(),
  discountCode: z.string().trim().max(40).nullish(),
  country: z.string().length(2).default(HOME_COUNTRY),
  email: z.string().email().nullish().or(z.literal("")),
});

export const placeOrderSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your basket is empty").max(50),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.nullish(),
  billingSameAsShipping: z.boolean().default(true),
  shippingMethodId: z.string().min(1, "Choose a delivery method"),
  discountCode: z.string().trim().max(40).nullish(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  giftMessage: z.string().trim().max(300).optional().or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
  /** Square Web Payments token. Absent when Square isn't configured yet. */
  sourceId: z.string().nullish(),
  verificationToken: z.string().nullish(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const guestLookupSchema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
  email: z.string().trim().email("Enter the email used for the order"),
});

export const profileSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters").max(200),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const savedAddressSchema = addressFields
  .extend({
    id: z.string().nullish(),
    label: z.string().trim().max(40).default("Home"),
    isDefault: z.boolean().default(false),
  })
  .superRefine(requirePostcodeWhereUsed);

export const shipOrderSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.string().min(1, "Choose a carrier"),
  trackingNumber: z.string().trim().max(80).optional().or(z.literal("")),
  notifyCustomer: z.boolean().default(true),
});

export const refundSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive("Enter an amount above zero"),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
  restock: z.boolean().default(true),
  notifyCustomer: z.boolean().default(true),
});

export const discountCodeSchema = z.object({
  id: z.string().nullish(),
  code: z
    .string()
    .trim()
    .min(3, "Codes need at least 3 characters")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, hyphens and underscores only"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0).max(100000),
  minSubtotal: z.number().min(0).nullish(),
  maxRedemptions: z.number().int().min(1).nullish(),
  perCustomerLimit: z.number().int().min(1).nullish(),
  isActive: z.boolean().default(true),
  endsAt: z.string().nullish(),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  authorName: z.string().trim().min(1, "Add your name").max(80),
});

/** Collapse a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
