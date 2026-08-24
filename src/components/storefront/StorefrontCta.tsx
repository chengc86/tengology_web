import Link from "next/link";
import { cn } from "@/lib/utils";

interface StorefrontCtaProps {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}

/** Square, hairline CTAs used across the customer storefront. */
export function StorefrontCta({
  href,
  children,
  variant = "solid",
  className,
}: StorefrontCtaProps) {
  return (
    <Link
      href={href}
      className={cn(
        "eyebrow inline-flex items-center justify-center px-8 py-4 transition-colors",
        variant === "solid"
          ? "border border-foreground bg-foreground !text-background hover:bg-transparent hover:!text-foreground"
          : "border border-foreground/30 !text-foreground hover:border-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}
