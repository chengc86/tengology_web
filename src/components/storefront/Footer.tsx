import Link from "next/link";

const footerLinks = {
  Shop: [
    { name: "All Products", href: "/shop" },
    { name: "Hair Accessories", href: "/shop?category=HAIR_ACCESSORIES" },
    { name: "Jewellery", href: "/shop?category=JEWELLERY" },
    { name: "Christmas", href: "/shop?category=CHRISTMAS_ORNAMENTS" },
    { name: "Brooches", href: "/shop?category=BROOCHES" },
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
    { name: "Stockists", href: "/pages/stockists" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-heading text-xl tracking-[0.15em] uppercase mb-4">
              Tengology
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Handcrafted accessories and jewellery, designed and made in
              Oxford. Each piece is unique and made with care.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs tracking-widest uppercase font-medium mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Tengology. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground tracking-wider uppercase transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground tracking-wider uppercase transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground tracking-wider uppercase transition-colors"
            >
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
