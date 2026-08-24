import type { Metadata } from "next";
import { StudioPage } from "@/components/storefront/StudioPage";

export const metadata: Metadata = {
  title: "Returns",
  description: "If a Tengology piece isn't quite right.",
};

export default function ReturnsPage() {
  return (
    <StudioPage eyebrow="Help" title="Returns">
      <p>
        Each piece is made by hand, so no two are quite the same. If your order
        arrives damaged, or isn&rsquo;t what you expected, write to us and we
        will make it right.
      </p>
      <p>
        Email{" "}
        <a href="mailto:hello@tengology.com" className="link-underline text-foreground">
          hello@tengology.com
        </a>{" "}
        with your order number and a short note. We&rsquo;ll reply from the
        studio as soon as we can.
      </p>
    </StudioPage>
  );
}
