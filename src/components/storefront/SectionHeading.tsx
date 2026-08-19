import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Editorial index label, e.g. "01" — rendered before the eyebrow. */
  index?: string;
  eyebrow?: string;
  title: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
}

/**
 * Gallery-editorial section heading: hairline rule, index + uppercase
 * micro-label, oversized serif title, optional right-aligned action link.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("border-t pt-6", className)}>
      {(index || eyebrow) && (
        <p className="eyebrow mb-4">
          {index && <span className="mr-3 text-foreground">{index}</span>}
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h2 className="font-heading text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="link-underline eyebrow pb-1 text-foreground transition-colors hover:text-moss"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
