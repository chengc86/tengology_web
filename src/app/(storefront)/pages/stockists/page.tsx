import type { Metadata } from "next";
import { StudioPage } from "@/components/storefront/StudioPage";

export const metadata: Metadata = {
  title: "Stockists",
  description: "Stock Tengology pieces from the Oxford studio.",
};

export default function StockistsPage() {
  return (
    <StudioPage eyebrow="The studio" title="Stockists">
      <p>
        Tengology is currently sold from the Oxford studio and this shop. If
        you would like to stock our pieces, write to{" "}
        <a href="mailto:hello@tengology.com" className="link-underline text-foreground">
          hello@tengology.com
        </a>
        .
      </p>
    </StudioPage>
  );
}
