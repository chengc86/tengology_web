import type { Metadata } from "next";
import { StudioPage } from "@/components/storefront/StudioPage";

export const metadata: Metadata = {
  title: "Shipping",
  description: "How Tengology pieces leave the Oxford studio.",
};

export default function ShippingPage() {
  return (
    <StudioPage eyebrow="Help" title="Shipping">
      <p>
        Every order is packed from the Oxford studio. Because pieces are made
        by hand, please allow a few days before dispatch — we&rsquo;ll email
        tracking as soon as it ships.
      </p>
      <p>UK delivery is free on orders over £50. Worldwide shipping is available.</p>
      <p>
        If you have a question about an order already on its way, use{" "}
        <a href="/orders/lookup" className="link-underline text-foreground">
          order tracking
        </a>{" "}
        or write to{" "}
        <a href="mailto:hello@tengology.com" className="link-underline text-foreground">
          hello@tengology.com
        </a>
        .
      </p>
    </StudioPage>
  );
}
