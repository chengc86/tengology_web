import type { Metadata } from "next";
import { StudioPage } from "@/components/storefront/StudioPage";
import { StorefrontCta } from "@/components/storefront/StorefrontCta";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to the Tengology studio in Oxford.",
};

export default function ContactPage() {
  return (
    <StudioPage eyebrow="The studio" title="Get in touch">
      <p>
        For orders, materials, or stockist enquiries, write to the studio. We
        read every note.
      </p>
      <p>
        <a href="mailto:hello@tengology.com" className="link-underline text-foreground">
          hello@tengology.com
        </a>
      </p>
      <p>Designed and made in Oxford.</p>
      <StorefrontCta href="/shop" variant="outline" className="mt-4">
        Shop the collection
      </StorefrontCta>
    </StudioPage>
  );
}
