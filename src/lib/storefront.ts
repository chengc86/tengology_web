export const categoryLabels: Record<string, string> = {
  HAIR_ACCESSORIES: "Hair Accessories",
  JEWELLERY: "Jewellery",
  CHRISTMAS_ORNAMENTS: "Christmas Ornaments",
  BROOCHES: "Brooches",
  OTHER: "Other",
};

export const homeCollections = [
  {
    name: "Hair Accessories",
    href: "/shop?category=HAIR_ACCESSORIES",
    description: "Handcrafted clips, barrettes & headbands",
    image: "/lookbook/felt-flower-headband-portrait.jpg",
  },
  {
    name: "Jewellery",
    href: "/shop?category=JEWELLERY",
    description: "Unique earrings, rings & necklaces",
    image: "/lookbook/howlite-worn-1.jpg",
  },
  {
    name: "Christmas",
    href: "/shop?category=CHRISTMAS_ORNAMENTS",
    description: "Festive ornaments & decorations",
    image: "/lookbook/felt-sprout-ornaments-pair.jpg",
  },
  {
    name: "Brooches",
    href: "/shop?category=BROOCHES",
    description: "Statement brooches & pins",
    image: "/Gemini_Generated_Image_9wvh4a9wvh4a9wvh.png",
  },
] as const;

export const categoryHeroes: Record<
  string,
  { image: string; alt: string; eyebrow: string }
> = {
  HAIR_ACCESSORIES: {
    image: "/lookbook/felt-flower-headbands-garden.jpg",
    alt: "Two girls in a garden wearing handmade wool felt flower headbands",
    eyebrow: "Wool felt",
  },
  JEWELLERY: {
    image: "/lookbook/clear-quartz-worn-2.jpg",
    alt: "Clear quartz bracelet styled with a white linen outfit",
    eyebrow: "Crystal jewellery",
  },
  CHRISTMAS_ORNAMENTS: {
    image: "/lookbook/felt-sprout-ornaments-wreath-wide.jpg",
    alt: "A willow wreath laid with handmade wool felt sprout ornaments and brass bells",
    eyebrow: "The festive studio",
  },
  BROOCHES: {
    image: "/Gemini_Generated_Image_9wvh4a9wvh4a9wvh.png",
    alt: "Handmade felt, batik and glass brooches arranged on a ceramic plate",
    eyebrow: "Pins & brooches",
  },
};

export const defaultShopHero = {
  image: "/lookbook/felt-flower-headbands-garden.jpg",
  alt: "Two girls lying in the grass wearing handmade wool felt flower headbands",
  eyebrow: "The catalogue",
};

export function shopHref(params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}
