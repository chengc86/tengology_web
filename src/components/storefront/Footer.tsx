import Link from "next/link";

const footerLinks = {
  Shop: [
    { name: "All Products", href: "/shop" },
    { name: "Hair Accessories", href: "/shop?category=HAIR_ACCESSORIES" },
    { name: "Jewellery", href: "/shop?category=JEWELLERY" },
    { name: "Christmas", href: "/shop?category=CHRISTMAS_ORNAMENTS" },
    { name: "Brooches", href: "/shop?category=BROOCHES" },
    { name: "Design Your Own", href: "/designer/bracelet" },
  ],
  Help: [
    { name: "Track Your Order", href: "/orders/lookup" },
    { name: "My Account", href: "/account" },
    { name: "Shipping", href: "/pages/shipping" },
    { name: "Returns", href: "/pages/returns" },
    { name: "FAQ", href: "/pages/faq" },
    { name: "Contact", href: "/pages/contact" },
  ],
  About: [
    { name: "Our Story", href: "/pages/about" },
    { name: "Crystal Guide", href: "/encyclopedia" },
    { name: "Stockists", href: "/pages/stockists" },
  ],
};

const social = [
  { name: "Instagram", href: "https://instagram.com" },
  { name: "Facebook", href: "https://facebook.com" },
  { name: "TikTok", href: "https://tiktok.com" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand statement */}
          <div className="lg:col-span-6">
            <p className="eyebrow mb-5">Tengology</p>
            <h2 className="font-heading text-4xl leading-[0.95] sm:text-5xl">
              Made slowly, <em>in Oxford.</em>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Handcrafted accessories and crystal jewellery. Every piece is cut,
              stitched, or threaded by hand — so no two are quite the same.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="eyebrow mb-5 text-foreground">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="eyebrow">
            &copy; {new Date().getFullYear()} Tengology
          </p>
          <div className="flex items-center gap-8">
            {social.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline eyebrow transition-colors hover:text-foreground"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
