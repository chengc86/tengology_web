"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in ms, applied via transition-delay. */
  delay?: number;
  variant?: "up" | "fade" | "left";
  /** Reveal once and stop observing (default), or toggle on every entry. */
  once?: boolean;
  threshold?: number;
  className?: string;
}

/**
 * Scroll-triggered reveal wrapper. The animation itself is pure CSS (see
 * [data-reveal] in globals.css); this component only toggles a data
 * attribute via IntersectionObserver, so server-rendered children pass
 * straight through. Content renders visible when IntersectionObserver is
 * unavailable, and reduced-motion users see no movement at all.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  once = true,
  threshold = 0.15,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-shown", "true");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      data-reveal={variant}
      data-shown={shown ? "true" : undefined}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined
      }
      className={className}
    >
      {children}
    </div>
  );
}
