import type { Metadata } from "next";
import { StudioPage } from "@/components/storefront/StudioPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about Tengology pieces and orders.",
};

const faqs = [
  {
    q: "Where are the pieces made?",
    a: "Every piece is designed and handmade in Oxford from wool felt, wood, crystal, and other natural materials.",
  },
  {
    q: "Can I design my own jewellery?",
    a: "Yes. The Design Your Own studio lets you choose crystals and build a bracelet, necklace, ring, or earrings.",
  },
  {
    q: "Do you offer gift wrapping?",
    a: "Pieces leave the studio on a Tengology kraft tag, ready to gift. You can add a gift message at checkout.",
  },
  {
    q: "How do I track an order?",
    a: "Use Track Your Order with your order number and email, or sign in to see everything in your account.",
  },
];

export default function FaqPage() {
  return (
    <StudioPage eyebrow="Help" title="Questions">
      {faqs.map((item) => (
        <div key={item.q} className="border-t pt-5">
          <h2 className="font-heading text-2xl leading-tight text-foreground">{item.q}</h2>
          <p className="mt-2">{item.a}</p>
        </div>
      ))}
    </StudioPage>
  );
}
