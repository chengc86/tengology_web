import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SeedVariant = {
  name: string;
  stockCount?: number;
  imageUrl?: string;
};

type SeedProduct = {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory?: string;
  materials: string;
  price: number;
  stockCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  collection: string;
  intention?: string;
  images?: { url: string; altText: string }[];
  variants?: SeedVariant[];
};

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tengology.com" },
    update: {},
    create: {
      email: "admin@tengology.com",
      name: "Tengology Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", admin.email);

  // Remove deprecated placeholder products
  const deprecatedSlugs = [
    "dusty-rose-wool-felt-bow-clip",
    "strawberry-felt-hair-bobble",
    // Previously separate listings now consolidated under variants
    "felt-dahlia-headband-peach",
    "felt-dahlia-headband-mauve",
    "felt-dahlia-headband-lavender",
    "felt-dahlia-headband-mint",
    "felt-dahlia-headband-salmon",
    "daffodil-felt-hair-clip-golden",
    "daffodil-felt-hair-clip-pale",
    "oversized-bloom-headband-lilac",
    "oversized-bloom-headband-coral",
    "spring-bouquet-brooch-golden",
    "spring-bouquet-brooch-pale",
  ];
  for (const slug of deprecatedSlugs) {
    await prisma.product.delete({ where: { slug } }).catch(() => {});
  }

  const products: SeedProduct[] = [
    // ─── Strawberries collection ─────────────────────────
    {
      slug: "strawberry-felt-headband-crimson",
      title: "Strawberry Felt Headband — Crimson Ribbon",
      shortDescription:
        "A hand-felted strawberry headband on a crimson satin ribbon — every piece slightly different, no two alike.",
      fullDescription:
        "Each strawberry on this headband is hand-felted in our Oxford studio, lightly stitched with delicate white seed details, and clustered around a small wool blossom and trailing leaves. The cluster sits on a metal headband wrapped in soft crimson satin ribbon for a comfortable, secure fit.\n\n✦ Made entirely by hand · One of a kind\n\nBecause every berry is shaped, sewn, and arranged by hand, no two headbands are identical — expect small, lovely variations in the size of each fruit, the angle of the blossom, and the way the cluster sits. That's the charm of a piece that's truly handmade.\n\nHandmade in Oxford. Comes on a Tengology kraft tag, ready to gift.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 20.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/headband-red-hero.jpg",
          altText: "Crimson strawberry felt headband held in hand",
        },
        {
          url: "/products/strawberries/headband-model.png",
          altText: "Little girl wearing the strawberry felt headband in soft studio light",
        },
        {
          url: "/products/strawberries/strawberry-headband-model-candid-v1.png",
          altText: "Child model wearing the crimson strawberry felt headband in a candid garden picnic scene",
        },
        {
          url: "/products/strawberries/closeup-1.jpg",
          altText: "Strawberry headband close-up alongside other strawberry accessories",
        },
        {
          url: "/products/strawberries/flat-lay-top.jpg",
          altText: "The full Strawberries collection laid out on a kraft background",
        },
        {
          url: "/collections/strawberries.jpg",
          altText: "Strawberries collection pieces on Tengology kraft tags",
        },
        {
          url: "/products/strawberries/collection-flatlay-white-2.jpg",
          altText: "Strawberry felt headband laid out with matching clips and hair elastic",
        },
      ],
    },
    {
      slug: "strawberry-felt-headband-sage",
      title: "Strawberry Felt Headband — Sage Ribbon",
      shortDescription:
        "A hand-felted strawberry headband on a sage satin ribbon — every piece slightly different, no two alike.",
      fullDescription:
        "A softer-toned sister to our crimson headband: a cluster of plump, hand-felted red strawberries, a tiny wool blossom, and trailing leaves, mounted on a metal headband wrapped in sage-green satin ribbon.\n\n✦ Made entirely by hand · One of a kind\n\nEach berry is shaped, stitched with delicate white seed details, and arranged by hand — no two headbands are quite the same. Expect small, lovely variations in the size and angle of each strawberry. That's the mark of something truly handmade.\n\nHandmade in Oxford. Comes on a Tengology kraft tag, ready to gift.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 20.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/closeup-2.jpg",
          altText: "Sage-ribbon strawberry felt headband close-up",
        },
        {
          url: "/products/strawberries/collection-flatlay-white-2.jpg",
          altText: "Sage-green strawberry felt headband with matching clips",
        },
        {
          url: "/products/strawberries/flat-lay-top.jpg",
          altText: "The full Strawberries collection laid out on a kraft background",
        },
        {
          url: "/collections/strawberries.jpg",
          altText: "Strawberries collection pieces on Tengology kraft tags",
        },
      ],
    },
    {
      slug: "strawberry-felt-hair-clip-pair",
      title: "Strawberry Felt Hair Clip Pair",
      shortDescription:
        "A matching pair of hand-felted strawberry hair clips with leaves and a tiny blossom.",
      fullDescription:
        "Sold as a pair, these little clips each carry a hand-felted red strawberry, soft green felt leaves, and a small wool blossom. Mounted on sturdy lined hair clips that hold securely in fine and thicker hair alike.\n\nWear them together for symmetry, or split them between two heads — they're a sweet matching gift for sisters or friends.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, lined metal hair clips",
      price: 14.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/collection-flatlay-white.jpg",
          altText: "Strawberry hair clip pair with matching strawberry accessories",
        },
        {
          url: "/products/strawberries/flat-lay-top.jpg",
          altText: "Strawberry hair clip pair shown with the rest of the Strawberries collection",
        },
        {
          url: "/collections/strawberries.jpg",
          altText: "Strawberry clips on Tengology kraft tags",
        },
      ],
    },
    {
      slug: "strawberry-cluster-hair-pin",
      title: "Strawberry Cluster Hair Pin",
      shortDescription:
        "A statement hair pin packed with felted strawberries, leaves, and a wool blossom.",
      fullDescription:
        "A bolder piece for those who want their berries by the bunch — multiple hand-felted strawberries are gathered with leaves and a tiny wool blossom on a strong hair pin.\n\nEach berry is shaped, stitched, and arranged by hand, so the cluster sits just so. Lovely tucked into a low bun, half-up style, or a braid.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, metal hair pin",
      price: 12.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/claw-clip-worn.jpg",
          altText: "Strawberry cluster claw clip worn in a half-up hairstyle",
        },
        {
          url: "/products/strawberries/flat-lay-angle-1.jpg",
          altText: "Strawberry cluster hair pin in the Strawberries collection",
        },
        {
          url: "/products/strawberries/collection-flatlay-white.jpg",
          altText: "Strawberry cluster clip shown with the rest of the family",
        },
      ],
    },
    {
      slug: "single-strawberry-hair-clip",
      title: "Single Strawberry Hair Clip",
      shortDescription:
        "A petite hand-felted strawberry on a small hair clip — sweet on its own or layered.",
      fullDescription:
        "The smallest piece in the Strawberries collection: a single hand-felted strawberry topped with a tiny wool blossom and a leaf, mounted on a petite hair clip.\n\nLovely for little ones, and just as charming on grown-ups for a touch of fruit-stand whimsy. Wear one solo, or stack a few for a playful look.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, lined metal hair clip",
      price: 8.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/flat-lay-angle-2.jpg",
          altText: "Single strawberry hair clip in the Strawberries collection",
        },
        {
          url: "/products/strawberries/collection-flatlay-white.jpg",
          altText: "Single strawberry clips laid out with matching accessories",
        },
      ],
    },
    {
      slug: "strawberry-felt-scrunchie",
      title: "Strawberry Felt Scrunchie",
      shortDescription:
        "A soft fluffy scrunchie nestled with a cluster of hand-felted strawberries and a wool blossom.",
      fullDescription:
        "A cosy fluffy scrunchie wrapped in soft cream fabric, accented with a cluster of hand-felted strawberries, leaves, and a tiny wool blossom.\n\nGentle on hair, comfortable to wear all day, and the felt cluster keeps its shape wash after wash. A treat to wear and an easy gift.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, soft fluffy fabric, hair elastic",
      price: 12.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/collection-flatlay-white-2.jpg",
          altText: "Strawberry felt scrunchie with matching strawberry accessories",
        },
        {
          url: "/products/strawberries/flat-lay-top.jpg",
          altText: "Strawberry felt scrunchie shown in the Strawberries collection",
        },
        {
          url: "/collections/strawberries.jpg",
          altText: "Strawberry scrunchie on a Tengology kraft tag with the collection",
        },
      ],
    },
    {
      slug: "strawberry-blossom-felt-brooch",
      title: "Strawberry & Blossom Felt Brooch",
      shortDescription:
        "A hand-felted brooch with a cluster of red and pink strawberries around a wool blossom.",
      fullDescription:
        "A wearable little fruit basket: hand-felted red and blush strawberries gathered around a wool blossom and felt leaves, finished on a quality brooch back.\n\nPin to coats, scarves, bags, or hats — a small handmade detail that makes everyday outfits feel a bit more cared-for.\n\nHandmade in Oxford.",
      category: "BROOCHES",
      materials: "wool felt, metal brooch back",
      price: 15.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Strawberries",
      images: [
        {
          url: "/products/strawberries/hat-cluster-worn.jpg",
          altText: "Strawberry and blossom felt cluster worn on a straw hat",
        },
        {
          url: "/products/strawberries/flat-lay-angle-1.jpg",
          altText: "Strawberry and blossom felt brooch with the Strawberries collection",
        },
        {
          url: "/collections/strawberries.jpg",
          altText: "Strawberry brooch on a Tengology kraft tag",
        },
      ],
    },

    // ─── Cottage Garden collection ───────────────────────
    {
      slug: "pink-hydrangea-felt-hair-clip",
      title: "Pink Hydrangea Felt Hair Clip",
      shortDescription:
        "A petal-cluster hair clip in soft pink with a pearl centre — every piece slightly different, no two alike.",
      fullDescription:
        "A delicate cluster of hand-cut pink felt petals gathered around a single pearl, with two slender green leaves tucked beneath. Mounted on a velvet-wrapped alligator clip that holds firmly without snagging fine hair.\n\n✦ Made entirely by hand · One of a kind\n\nEvery petal is cut, shaped, and stitched by hand, so each clip carries small, lovely variations in petal curl and the way the pearl sits. That's the charm of something truly handmade.\n\nHandmade in Oxford. Comes on a Tengology kraft tag, ready to gift.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, faux pearl, velvet-wrapped alligator clip",
      price: 9.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/hydrangea-clip-hero.jpg", altText: "Pink hydrangea felt hair clip on a Tengology kraft tag" },
        { url: "/products/cottage-garden/hydrangea-clip-2.jpg", altText: "Pink hydrangea hair clip from a second angle" },
        { url: "/products/cottage-garden/hydrangea-clip-group.jpg", altText: "Pink hydrangea hair clip with the matching brooch, headband, and claw clip" },
      ],
    },
    {
      slug: "pink-hydrangea-felt-brooch",
      title: "Pink Hydrangea Felt Brooch",
      shortDescription:
        "A fuller petal-cluster brooch in soft pink with a pearl centre — every piece slightly different.",
      fullDescription:
        "A fuller, slightly larger version of our pink hydrangea cluster, finished on a quality pin back. Hand-cut petals in soft blush gather around a single pearl, with green felt leaves tucked beneath.\n\n✦ Made entirely by hand · One of a kind\n\nPin to coats, scarves, lapels, or bags. Because every petal is shaped by hand, no two brooches are identical.\n\nHandmade in Oxford. Comes on a Tengology kraft tag.",
      category: "BROOCHES",
      materials: "wool felt, faux pearl, metal brooch back",
      price: 14.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/hydrangea-brooch-hero.jpg", altText: "Pink hydrangea felt brooch" },
        { url: "/products/cottage-garden/hydrangea-brooch-group.jpg", altText: "Pink hydrangea brooch shown with matching pieces" },
      ],
    },
    {
      slug: "pink-hydrangea-felt-headband",
      title: "Pink Hydrangea Felt Headband",
      shortDescription:
        "A cream headband with a row of soft pink hydrangea blooms and green felt leaves.",
      fullDescription:
        "A row of hand-cut pink felt hydrangea blooms — each with a tiny pearl at its heart — sits across the top of an ivory satin-wrapped metal headband, threaded with delicate green leaves.\n\n✦ Made entirely by hand · One of a kind\n\nEvery petal is cut, layered, and stitched by hand. Expect small variations in the way each bloom sits — that's the mark of handmade.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, faux pearls, satin ribbon, metal headband",
      price: 22.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/hydrangea-headband-hero.jpg", altText: "Pink hydrangea felt headband — close-up" },
        { url: "/products/cottage-garden/hydrangea-headband-2.jpg", altText: "Pink hydrangea headband from a second angle" },
        { url: "/products/cottage-garden/hydrangea-headband-group.jpg", altText: "Pink hydrangea headband with matching clip, brooch, and claw clip" },
      ],
    },
    {
      slug: "pink-hydrangea-pearl-claw-clip",
      title: "Pink Hydrangea Pearl Claw Clip",
      shortDescription:
        "A blush faux-fur claw clip with a hand-felted pink hydrangea and a dangling pearl chain.",
      fullDescription:
        "A statement piece: a soft blush faux-fur claw clip topped with a pink hydrangea cluster and finished with a dangling pearl chain ending in a tiny bud.\n\n✦ Made entirely by hand · One of a kind\n\nHolds thick hair securely while staying lightweight. Beautiful as the only accessory in a soft up-do.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, faux fur, faux pearls, metal claw clip",
      price: 18.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/hydrangea-clawclip-hero.jpg", altText: "Pink hydrangea pearl claw clip" },
        { url: "/products/cottage-garden/hydrangea-clawclip-2.jpg", altText: "Pearl claw clip from a second angle" },
      ],
    },
    {
      slug: "forget-me-not-felt-hair-clip",
      title: "Forget-Me-Not Felt Hair Clip",
      shortDescription:
        "A tiny cluster of two blue forget-me-nots with yellow stamen dots on a green velvet clip.",
      fullDescription:
        "Two delicate forget-me-not blooms — hand-cut from soft cornflower-blue felt with bright yellow stamen dots — nestled with leaves on a green velvet-wrapped alligator clip.\n\n✦ Made entirely by hand · One of a kind\n\nA quiet, romantic piece. Every flower is shaped and stitched by hand, so no two clips are quite the same.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, velvet-wrapped alligator clip",
      price: 9.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/forget-me-not-clip-hero.jpg", altText: "Forget-me-not blue felt hair clip" },
        { url: "/products/cottage-garden/forget-me-not-clip-2.jpg", altText: "Forget-me-not hair clip second angle" },
        { url: "/products/cottage-garden/forget-me-not-clip-group.jpg", altText: "Forget-me-not clip with matching brooch and barrette" },
      ],
    },
    {
      slug: "forget-me-not-felt-brooch",
      title: "Forget-Me-Not Felt Brooch",
      shortDescription:
        "Two cornflower-blue forget-me-not blooms nestled in a star of green leaves.",
      fullDescription:
        "Two hand-cut forget-me-not blooms with tiny yellow stamen dots, set in a star of green felt leaves on a quality pin back.\n\n✦ Made entirely by hand · One of a kind\n\nA quiet, sentimental brooch — the flower of remembrance, made one at a time.\n\nHandmade in Oxford.",
      category: "BROOCHES",
      materials: "wool felt, embroidery thread, metal brooch back",
      price: 13.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/forget-me-not-brooch-hero.jpg", altText: "Forget-me-not felt brooch" },
        { url: "/products/cottage-garden/forget-me-not-brooch-2.jpg", altText: "Forget-me-not brooch second angle" },
      ],
    },
    {
      slug: "forget-me-not-long-barrette",
      title: "Forget-Me-Not Long Barrette",
      shortDescription:
        "A long barrette set with a row of blue forget-me-nots and tiny white accent blooms.",
      fullDescription:
        "A row of hand-cut blue forget-me-nots — each with a yellow stamen dot — alternates with small white accent blooms along the length of a rectangular barrette. Holds half-up styles or sweeps a fringe back cleanly.\n\n✦ Made entirely by hand · One of a kind\n\nEvery bloom is cut and stitched by hand, so the spacing and tilt of each flower is unique.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, metal barrette",
      price: 14.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/forget-me-not-barrette-hero.jpg", altText: "Forget-me-not long barrette with multiple blooms" },
        { url: "/products/cottage-garden/forget-me-not-barrette-2.jpg", altText: "Forget-me-not barrette second angle" },
        { url: "/products/cottage-garden/forget-me-not-barrette-group.jpg", altText: "Forget-me-not barrette with the rest of the family" },
      ],
    },
    {
      slug: "peach-hibiscus-felt-hair-clip",
      title: "Peach Hibiscus Felt Hair Clip",
      shortDescription:
        "A warm peach hibiscus bloom with magenta stamens on a red velvet clip.",
      fullDescription:
        "A bold, warm bloom: hand-cut peach felt petals around hot-pink stamen dots, finished with deep green leaves on a red velvet-wrapped alligator clip.\n\n✦ Made entirely by hand · One of a kind\n\nEvery petal is shaped by hand — the curl and depth of each bloom varies slightly, so no two clips are alike.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, velvet-wrapped alligator clip",
      price: 9.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/peach-hibiscus-clip-hero.jpg", altText: "Peach hibiscus felt hair clip" },
        { url: "/products/cottage-garden/peach-hibiscus-clip-2.jpg", altText: "Peach hibiscus clip second angle" },
        { url: "/products/cottage-garden/peach-hibiscus-clip-group.jpg", altText: "Peach hibiscus clips and brooch shown together" },
      ],
    },
    {
      slug: "peach-hibiscus-felt-brooch",
      title: "Peach Hibiscus Felt Brooch",
      shortDescription:
        "A peach hibiscus with magenta stamens and green leaves on a quality pin back.",
      fullDescription:
        "The brooch version of our peach hibiscus design — warm peach petals around hot-pink stamens, framed by deep green leaves.\n\n✦ Made entirely by hand · One of a kind\n\nHandmade in Oxford.",
      category: "BROOCHES",
      materials: "wool felt, embroidery thread, metal brooch back",
      price: 14.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/peach-hibiscus-brooch-hero.jpg", altText: "Peach hibiscus felt brooch" },
        { url: "/products/cottage-garden/peach-hibiscus-brooch-2.jpg", altText: "Peach hibiscus brooch second angle" },
      ],
    },
    {
      slug: "daffodil-felt-hair-clip",
      title: "Daffodil Felt Hair Clip",
      shortDescription:
        "A single daffodil hair clip with an orange trumpet — available in golden yellow or pale lemon.",
      fullDescription:
        "A single hand-cut daffodil with a warm orange trumpet, two slender green leaves, on a yellow ribbon-wrapped alligator clip.\n\n✦ Made entirely by hand · One of a kind\n\nAvailable in two colourways — choose Golden Yellow for a sunny pop, or Pale Lemon for a softer look. Each piece is shaped by hand, so no two daffodils sit the same way.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, alligator clip",
      price: 9.0,
      stockCount: 2,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/daffodil-clip-group.jpg", altText: "Both daffodil clip colourways shown together" },
        { url: "/products/cottage-garden/daffodil-clip-golden-hero.jpg", altText: "Golden yellow daffodil felt hair clip" },
        { url: "/products/cottage-garden/daffodil-clip-pale-hero.jpg", altText: "Pale lemon daffodil felt hair clip" },
        { url: "/products/cottage-garden/daffodil-clip-pale-2.jpg", altText: "Pale daffodil clip second angle" },
      ],
      variants: [
        { name: "Golden Yellow", stockCount: 1, imageUrl: "/products/cottage-garden/daffodil-clip-golden-hero.jpg" },
        { name: "Pale Lemon", stockCount: 1, imageUrl: "/products/cottage-garden/daffodil-clip-pale-hero.jpg" },
      ],
    },
    {
      slug: "daffodil-felt-lapel-pin",
      title: "Daffodil Felt Lapel Pin",
      shortDescription:
        "A single daffodil on a long stick pin — for jackets, hats, and lapels.",
      fullDescription:
        "A single hand-cut daffodil mounted on a long metal stick pin. A quiet alternative to a brooch — pin it through a lapel, a hat brim, or a scarf.\n\n✦ Made entirely by hand · One of a kind\n\nHandmade in Oxford.",
      category: "BROOCHES",
      materials: "wool felt, metal stick pin",
      price: 10.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Cottage Garden",
      images: [
        { url: "/products/cottage-garden/daffodil-lapel-pin-hero.jpg", altText: "Daffodil felt lapel pin on a kraft tag" },
        { url: "/products/cottage-garden/daffodil-lapel-pin-2.jpg", altText: "Daffodil lapel pin second angle" },
      ],
    },

    // ─── Spring Bouquet collection ───────────────────────
    {
      slug: "spring-bouquet-brooch",
      title: "Spring Bouquet Brooch",
      shortDescription:
        "A statement spring bouquet brooch — available with a golden daffodil or a pale daffodil with coral pansy.",
      fullDescription:
        "A small spring bouquet pinned to your coat, lavender sprigs, peach rose buds, and tiny accent blooms gathered around a central daffodil.\n\n✦ Made entirely by hand · One of a kind\n\nTwo variants: **Golden Daffodil** has a deep yellow centre with lavender + peach accents; **Pale Daffodil & Coral** has a soft lemon centre with a coral-peach pansy at the shoulder and cream filler blooms.\n\nHandmade in Oxford.",
      category: "BROOCHES",
      materials: "wool felt, embroidery thread, metal brooch back",
      price: 18.0,
      stockCount: 2,
      isPublished: true,
      isFeatured: true,
      collection: "Spring Bouquet",
      images: [
        { url: "/products/spring-bouquet/daffodil-brooch-group.jpg", altText: "Spring bouquet brooches shown together" },
        { url: "/products/spring-bouquet/daffodil-brooch-golden-hero.jpg", altText: "Spring bouquet brooch with golden daffodil" },
        { url: "/products/spring-bouquet/daffodil-brooch-pale-hero.jpg", altText: "Spring bouquet brooch with pale daffodil and coral pansy" },
        { url: "/products/spring-bouquet/daffodil-brooch-golden-2.jpg", altText: "Golden daffodil bouquet brooch from above" },
        { url: "/products/spring-bouquet/daffodil-brooch-pale-2.jpg", altText: "Pale daffodil and coral bouquet brooch from above" },
      ],
      variants: [
        { name: "Golden Daffodil", stockCount: 1, imageUrl: "/products/spring-bouquet/daffodil-brooch-golden-hero.jpg" },
        { name: "Pale Daffodil & Coral", stockCount: 1, imageUrl: "/products/spring-bouquet/daffodil-brooch-pale-hero.jpg" },
      ],
    },
    {
      slug: "spring-bouquet-statement-headband",
      title: "Spring Bouquet Statement Headband",
      shortDescription:
        "A lavender satin headband with a side cluster of daffodils, lavender, and peach buds.",
      fullDescription:
        "A side-mounted cluster of spring florals on a lavender satin-wrapped metal headband — a deep yellow daffodil, pale daffodil, lavender sprigs, peach rose buds, and trailing greenery.\n\n✦ Made entirely by hand · One of a kind\n\nA statement headband for weddings, races, or anywhere you want to feel like you're walking through a garden.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 28.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Spring Bouquet",
      images: [
        { url: "/products/spring-bouquet/spring-headband-hero.jpg", altText: "Spring bouquet statement headband with daffodils and lavender" },
        { url: "/products/spring-bouquet/spring-headband-2.jpg", altText: "Spring headband second angle" },
      ],
    },
    {
      slug: "spring-bouquet-faux-fur-scrunchie",
      title: "Spring Bouquet Faux-Fur Scrunchie",
      shortDescription:
        "A cream faux-fur scrunchie crowned with a cluster of daffodils, lavender, and forget-me-not buds.",
      fullDescription:
        "A cosy cream faux-fur scrunchie topped with a small spring bouquet — daffodils, lavender, peach buds, and a blue forget-me-not.\n\n✦ Made entirely by hand · One of a kind\n\nSoft on hair, comfortable all day, and the felt cluster keeps its shape with care.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, faux fur, hair elastic",
      price: 16.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Spring Bouquet",
      images: [
        { url: "/products/spring-bouquet/spring-scrunchie-hero.jpg", altText: "Spring bouquet faux-fur scrunchie" },
        { url: "/products/spring-bouquet/spring-scrunchie-2.jpg", altText: "Spring scrunchie second angle" },
        { url: "/products/spring-bouquet/spring-scrunchie-variants.jpg", altText: "Three spring scrunchies in a row showing slight variations" },
      ],
    },
    {
      slug: "easter-bunny-ear-floral-headband",
      title: "Easter Bunny Ear Floral Headband",
      shortDescription:
        "White felt bunny ears with gold trim, crowned with a wreath of spring florals.",
      fullDescription:
        "A statement piece for Easter and beyond: tall white wool felt bunny ears with pink inner-ear and delicate gold beaded trim, mounted on a cream satin headband with a wreath of spring florals at the base — yellow daffodils, lavender, pink buds, and greenery.\n\n✦ Made entirely by hand · One of a kind\n\nA little theatrical, a lot beautiful. Perfect for spring photoshoots, Easter Sunday, or as a one-off statement piece.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, gold beads, metal headband",
      price: 32.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Spring Bouquet",
      images: [
        { url: "/products/spring-bouquet/bunny-ear-headband-hero.jpg", altText: "Easter bunny ear floral headband — close-up" },
        { url: "/products/spring-bouquet/bunny-ear-headband-2.jpg", altText: "Bunny ear headband second angle" },
        { url: "/products/spring-bouquet/bunny-ear-group.jpg", altText: "Bunny ear headband shown with the matching hair clip" },
      ],
    },
    {
      slug: "easter-bunny-ear-floral-hair-clip",
      title: "Easter Bunny Ear Floral Hair Clip",
      shortDescription:
        "A smaller bunny-ear-and-florals piece on a hair clip — for little ones or layered styles.",
      fullDescription:
        "A clip-on version of our bunny ear floral headband: white felt bunny ears with gold trim and a small spring wreath, mounted on a sturdy hair clip.\n\n✦ Made entirely by hand · One of a kind\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, gold beads, alligator clip",
      price: 18.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Spring Bouquet",
      images: [
        { url: "/products/spring-bouquet/bunny-ear-clip-hero.jpg", altText: "Easter bunny ear floral hair clip" },
        { url: "/products/spring-bouquet/bunny-ear-clip-2.jpg", altText: "Bunny ear clip second angle" },
      ],
    },

    // ─── Dahlia collection ───────────────────────────────
    {
      slug: "felt-dahlia-headband",
      title: "Felt Dahlia Headband",
      shortDescription:
        "A layered hand-cut dahlia headband — available in five colourways. Every piece slightly different.",
      fullDescription:
        "Each petal of this dahlia is hand-cut from wool felt and layered to give the bloom real depth. The textured centre is built from coiled felt yarn, finished with small accent rose buds and dark green leaves. Mounted on a satin-wrapped metal headband.\n\n✦ Made entirely by hand · One of a kind\n\nAvailable in five colourways:\n· **Peach** — peach petals with a coral textured centre and tiny orange rose buds\n· **Mauve Pink** — mauve petals with a magenta centre and magenta rose accents\n· **Lavender** — lavender petals with a deep purple centre and darker purple buds\n· **Mint** — mint and white petals with a teal centre and blue accents\n· **Salmon** — salmon-blush petals with a hot-pink centre and matching filler buds\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 24.0,
      stockCount: 5,
      isPublished: true,
      isFeatured: true,
      collection: "Dahlia",
      images: [
        { url: "/products/dahlia/dahlia-collection.jpg", altText: "All five dahlia headband colourways shown together" },
        { url: "/products/dahlia/dahlia-peach-hero.jpg", altText: "Peach felt dahlia headband — close-up" },
        { url: "/products/dahlia/dahlia-mauve-hero.jpg", altText: "Mauve pink felt dahlia headband" },
        { url: "/products/dahlia/dahlia-lavender-hero.jpg", altText: "Lavender felt dahlia headband" },
        { url: "/products/dahlia/dahlia-mint-hero.jpg", altText: "Mint felt dahlia headband" },
        { url: "/products/dahlia/dahlia-salmon-hero.jpg", altText: "Salmon felt dahlia headband" },
      ],
      variants: [
        { name: "Peach", stockCount: 1, imageUrl: "/products/dahlia/dahlia-peach-hero.jpg" },
        { name: "Mauve Pink", stockCount: 1, imageUrl: "/products/dahlia/dahlia-mauve-hero.jpg" },
        { name: "Lavender", stockCount: 1, imageUrl: "/products/dahlia/dahlia-lavender-hero.jpg" },
        { name: "Mint", stockCount: 1, imageUrl: "/products/dahlia/dahlia-mint-hero.jpg" },
        { name: "Salmon", stockCount: 1, imageUrl: "/products/dahlia/dahlia-salmon-hero.jpg" },
      ],
    },

    // ─── Statement Blooms collection ─────────────────────
    {
      slug: "pastel-daisy-headband-mint",
      title: "Pastel Daisy Headband — Mint",
      shortDescription:
        "A single oversized mint daisy with a pale yellow textured centre on an aqua headband.",
      fullDescription:
        "A single hand-cut daisy in mint and white, with a pale yellow textured pom-pom centre, mounted on a soft aqua velvet headband.\n\n✦ Made entirely by hand · One of a kind\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, velvet-wrapped headband",
      price: 18.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Statement Blooms",
      images: [
        { url: "/products/statement-blooms/daisy-mint-hero.jpg", altText: "Mint pastel daisy headband" },
      ],
    },
    {
      slug: "blue-anemone-headband",
      title: "Blue Anemone Headband",
      shortDescription:
        "A soft blue anemone with a gold-glitter textured centre on a butter-yellow headband.",
      fullDescription:
        "A single powder-blue felt anemone with a sparkling gold-glitter pom-pom centre, mounted on a butter-yellow satin-wrapped headband.\n\n✦ Made entirely by hand · One of a kind\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, glitter felt, satin ribbon, metal headband",
      price: 18.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Statement Blooms",
      images: [
        { url: "/products/statement-blooms/anemone-blue-hero.jpg", altText: "Blue anemone with gold-glitter centre headband" },
      ],
    },
    {
      slug: "oversized-bloom-headband",
      title: "Oversized Bloom Headband",
      shortDescription:
        "An oversized hand-cut felt flower headband — available in lilac or coral.",
      fullDescription:
        "A bold, oversized felt flower with a soft pink pom-pom centre, mounted on a satin-wrapped headband.\n\n✦ Made entirely by hand · One of a kind\n\nTwo colourways:\n· **Lilac** — lilac petals with a pink pom-pom centre on a lilac headband\n· **Coral** — coral petals with a pink pom-pom centre on a dusty-pink headband\n\nPair them together for a matching photoshoot.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 20.0,
      stockCount: 2,
      isPublished: true,
      isFeatured: false,
      collection: "Statement Blooms",
      images: [
        { url: "/products/statement-blooms/blooms-pair-hero.jpg", altText: "Lilac and coral oversized bloom headbands on grass" },
        { url: "/products/statement-blooms/blooms-pair-2.jpg", altText: "Oversized bloom headbands styled outdoors" },
      ],
      variants: [
        { name: "Lilac", stockCount: 1, imageUrl: "/products/statement-blooms/blooms-pair-hero.jpg" },
        { name: "Coral", stockCount: 1, imageUrl: "/products/statement-blooms/blooms-pair-hero.jpg" },
      ],
    },
    {
      slug: "sunflower-felt-headband",
      title: "Sunflower Felt Headband",
      shortDescription:
        "A bright layered felt sunflower on a satin-wrapped headband, finished with deep green leaves.",
      fullDescription:
        "A bold golden-yellow felt sunflower with layered hand-cut petals, a textured brown centre, and deep green leaves, mounted on a satin-wrapped headband.\n\n✦ Made entirely by hand · One of a kind\n\nEach sunflower is cut, layered, and assembled by hand, so the petals and leaves have small natural variations from piece to piece.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 20.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Statement Blooms",
      images: [
        { url: "/products/statement-blooms/sunflower-hero.jpg", altText: "Sunflower felt headband held in hand" },
        { url: "/products/sunflower/sunflower-headband-held.jpg", altText: "Sunflower felt headband shown from a second handheld angle" },
        { url: "/products/sunflower/sunflower-headband-original-v1.jpeg", altText: "Sunflower felt headband photographed on a studio surface" },
        { url: "/products/sunflower/sunflower-headband-on-basket.jpg", altText: "Sunflower felt headband displayed on a woven basket" },
        { url: "/products/sunflower/sunflower-headband-on-stone.jpg", altText: "Sunflower felt headband displayed on a stone" },
        { url: "/products/sunflower/sunflower-headband-and-clips-flatlay-v2.jpeg", altText: "Sunflower felt headband photographed with matching clips on ivory fabric" },
        { url: "/products/sunflower/sunflower-headband-clips-closeup-v2.jpeg", altText: "Close-up of the sunflower felt headband and matching clips" },
        { url: "/products/sunflower/sunflower-headband-clips-linen-v2.jpeg", altText: "Sunflower headband and clips arranged on textured linen" },
        { url: "/products/sunflower/sunflower-maker-table-wide-v2.jpeg", altText: "Sunflower felt accessories in progress on the studio worktable" },
      ],
    },
    {
      slug: "sunflower-felt-brooch",
      title: "Sunflower Felt Brooch",
      shortDescription:
        "A bright handmade sunflower brooch with layered wool felt petals and deep green leaves.",
      fullDescription:
        "A cheerful sunflower to pin onto coats, denim jackets, hats, bags, or cardigans. Each golden-yellow petal is hand-cut and layered from wool felt, with a raised brown textured centre and deep green felt leaves tucked behind.\n\n✦ Made entirely by hand · One of a kind\n\nThe brooch is finished on a quality pin back and made in small batches, so each sunflower has its own little tilt, petal shape, and handmade character.\n\nHandmade in Oxford. Comes on a Tengology kraft card, ready to gift.",
      category: "BROOCHES",
      materials: "wool felt, embroidery thread, metal brooch back",
      price: 15.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Statement Blooms",
      images: [
        { url: "/products/sunflower/sunflower-brooch-card-original-v1.jpeg", altText: "Sunflower felt brooch on a Tengology kraft card" },
        { url: "/products/sunflower/sunflower-brooch-front-v2.jpeg", altText: "Front view of the sunflower felt brooch on ivory fabric" },
        { url: "/products/sunflower/sunflower-brooch-card-fair.jpg", altText: "Sunflower felt brooch on a Tengology card at the market" },
        { url: "/products/sunflower/sunflower-brooch-card-fair-2.jpg", altText: "Sunflower felt brooch held on its handmade card" },
        { url: "/products/sunflower/sunflower-brooch-denim.jpg", altText: "Sunflower felt brooch pinned to a denim jacket" },
        { url: "/products/sunflower/sunflower-brooch-denim-side.jpg", altText: "Sunflower felt brooch on denim, side view" },
        { url: "/products/sunflower/sunflower-brooch-cardigan-lifestyle.jpg", altText: "Sunflower felt brooch worn on a cream cardigan outdoors" },
        { url: "/products/sunflower/sunflower-brooch-cardigan-close.jpg", altText: "Close-up of the sunflower felt brooch on a ribbed cardigan" },
        { url: "/products/sunflower/sunflower-brooch-on-wicker.jpg", altText: "Sunflower felt brooch photographed on a woven basket" },
        { url: "/products/sunflower/sunflower-brooch-flat-original-v1.jpeg", altText: "Sunflower felt brooch laid flat" },
        { url: "/products/sunflower/sunflower-brooch-lifestyle-v1.jpeg", altText: "Sunflower felt brooch lifestyle photograph" },
        { url: "/products/sunflower/sunflower-brooch-back-v2.jpeg", altText: "Back view of the sunflower felt brooch showing the metal pin" },
        { url: "/products/sunflower/sunflower-accessories-flatlay-v2.jpeg", altText: "Sunflower headband, brooch, barrette, and hair clip arranged together" },
        { url: "/products/sunflower/sunflower-maker-table-close-v2.jpeg", altText: "Sunflower felt brooches and accessories on the studio worktable" },
      ],
    },
    {
      slug: "sunflower-felt-barrette-clip",
      title: "Sunflower Felt Barrette Clip",
      shortDescription:
        "A statement sunflower barrette with layered yellow felt petals and deep green leaves.",
      fullDescription:
        "A bright sunflower barrette clip made from hand-cut wool felt petals, a textured brown centre, and layered green felt leaves. It is finished on a sturdy metal barrette clasp, giving a secure hold for half-up styles, ponytails, and loose waves.\n\n✦ Made entirely by hand · One of a kind\n\nEach flower is shaped and assembled by hand, so the petal angles and leaf placement vary slightly from piece to piece.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, metal barrette clip",
      price: 14.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Statement Blooms",
      images: [
        { url: "/products/sunflower/sunflower-barrette-front-v2.jpeg", altText: "Front view of the sunflower felt barrette clip" },
        { url: "/products/sunflower/sunflower-barrette-back-v2.jpeg", altText: "Back view of the sunflower felt barrette clip showing the metal clasp" },
        { url: "/products/sunflower/sunflower-accessories-flatlay-v2.jpeg", altText: "Sunflower headband, barrette, brooch, and hair clip arranged together" },
        { url: "/products/sunflower/sunflower-maker-table-close-v2.jpeg", altText: "Sunflower felt accessories on the studio worktable" },
      ],
    },
    {
      slug: "sunflower-felt-hair-clip",
      title: "Sunflower Felt Hair Clip",
      shortDescription:
        "A smaller handmade sunflower hair clip with layered felt petals and green leaves.",
      fullDescription:
        "A smaller sunflower clip for adding a bright handmade detail to everyday hair. The flower is built from layered golden-yellow wool felt petals, a textured brown centre, and deep green leaves, then mounted on a secure metal hair clip.\n\n✦ Made entirely by hand · One of a kind\n\nLovely on its own, paired with the matching headband, or worn as a little sunny accent in a half-up style.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, metal hair clip",
      price: 10.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Statement Blooms",
      images: [
        { url: "/products/sunflower/sunflower-clip-on-wicker.jpg", altText: "Smaller sunflower felt hair clip on a woven basket" },
        { url: "/products/sunflower/sunflower-flower-on-wicker.jpg", altText: "Sunflower felt flower close-up on wicker" },
        { url: "/products/sunflower/sunflower-headband-clips-linen-v2.jpeg", altText: "Smaller sunflower felt hair clip shown with matching headband and accessories" },
        { url: "/products/sunflower/sunflower-headband-clips-closeup-v2.jpeg", altText: "Close-up of the smaller sunflower felt hair clip and matching headband" },
        { url: "/products/sunflower/sunflower-accessories-flatlay-v2.jpeg", altText: "Sunflower felt hair clip with the matching headband, barrette, and brooch" },
        { url: "/products/sunflower/sunflower-maker-table-wide-v2.jpeg", altText: "Sunflower felt hair clips and accessories on the studio worktable" },
      ],
    },

    // ─── Woodland collection ─────────────────────────────
    {
      slug: "toadstool-daisy-felt-hair-clip",
      title: "Toadstool & Daisy Felt Hair Clip",
      shortDescription:
        "A red-and-white toadstool paired with a white daisy and autumn leaves on a green clip.",
      fullDescription:
        "A miniature forest floor on a hair clip: a classic red-and-white spotted toadstool sits beside a white wool daisy with a yellow centre, with rust-coloured oak leaves tucked between. Mounted on a green velvet-wrapped clip.\n\n✦ Made entirely by hand · One of a kind\n\nFor woodland walks, autumn weddings, and anyone who likes their hair accessories with a little story.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, velvet-wrapped alligator clip",
      price: 12.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Woodland",
      images: [
        { url: "/products/woodland/toadstool-daisy-hero.jpg", altText: "Toadstool and daisy felt hair clip on a wood slice" },
        { url: "/products/woodland/toadstool-daisy-2.jpg", altText: "Toadstool daisy clip with Tengology mark" },
        { url: "/products/woodland/toadstool-pair-group.jpg", altText: "Both woodland toadstool clips shown together" },
      ],
    },
    {
      slug: "toadstool-buttercup-felt-hair-clip",
      title: "Toadstool & Buttercup Felt Hair Clip",
      shortDescription:
        "A red-and-white toadstool paired with a small yellow buttercup on a green clip.",
      fullDescription:
        "The smaller, simpler sister to our Toadstool & Daisy clip: a red-and-white spotted toadstool beside a tiny yellow buttercup and a green felt leaf, on a green velvet-wrapped clip.\n\n✦ Made entirely by hand · One of a kind\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, velvet-wrapped alligator clip",
      price: 10.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Woodland",
      images: [
        { url: "/products/woodland/toadstool-buttercup-hero.jpg", altText: "Toadstool and buttercup felt hair clip" },
        { url: "/products/woodland/toadstool-pair-group.jpg", altText: "Both woodland toadstool clips shown together" },
      ],
    },
    {
      slug: "woodland-antler-headband",
      title: "Woodland Antler Headband",
      shortDescription:
        "A black headband crowned with felt antlers, toadstools, daisies, and autumn leaves.",
      fullDescription:
        "A full woodland scene on a black satin headband: small brown felt antlers, red-and-white spotted toadstools, white daisies, autumn pom-poms, and oak and maple leaves all gathered at the crown.\n\n✦ Made entirely by hand · One of a kind\n\nA dramatic, story-rich piece for autumn weddings, woodland photoshoots, or autumn-loving collectors.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 30.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Woodland",
      images: [
        { url: "/products/woodland/woodland-antler-headband-hero.jpg", altText: "Woodland antler headband with toadstools, daisies, and autumn leaves" },
      ],
    },

    // ─── Festive collection ──────────────────────────────
    {
      slug: "reindeer-antler-felt-headband",
      title: "Reindeer Antler Felt Headband",
      shortDescription:
        "A red ribbon headband with felt antlers, reindeer ears, roses, and snowy pom-poms.",
      fullDescription:
        "A Christmas statement headband: a red satin headband topped with brown felt antlers and reindeer ears, decorated with red felt roses, white pom-pom snowballs, holly berries, and deep green leaves.\n\n✦ Made entirely by hand · One of a kind\n\nFor Christmas photoshoots, school nativities, Christmas-day breakfasts, and the office party.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, satin ribbon, metal headband",
      price: 28.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Festive",
      images: [
        { url: "/products/festive/reindeer-antler-headband-hero.jpg", altText: "Reindeer antler felt headband with red roses and snowballs" },
      ],
    },
    {
      slug: "remembrance-poppy-felt-hair-clip",
      title: "Remembrance Poppy Felt Hair Clip",
      shortDescription:
        "A red poppy with a black centre and a small gold cross detail, on a black ribbon clip.",
      fullDescription:
        "A wool felt poppy with a black centre and a tiny gold cross-stitch detail, mounted on a black ribbon-wrapped alligator clip.\n\n✦ Made entirely by hand · One of a kind\n\nA quiet, respectful piece for Remembrance Sunday and the days around it.\n\nHandmade in Oxford.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, ribbon-wrapped alligator clip",
      price: 9.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Festive",
      images: [
        { url: "/products/festive/poppy-clip-hero.jpg", altText: "Remembrance poppy felt hair clip" },
      ],
    },

    // ─── Comet collection — crystal earrings ─────────────
    {
      slug: "green-fluorite-cluster-drop-earrings",
      title: "Green Fluorite Cluster Drop Earrings — Spring Thaw",
      shortDescription:
        "Mint-green faceted fluorite drops crowned with hand-wrapped clusters of lavender, grey-blue, sage and champagne rondelles, on 14k gold-plated S925 hooks.",
      fullDescription:
        "A mint-green fluorite nugget, faceted into a soft octagonal silhouette, anchors each earring with cool, glassy translucence. Above it sits a hand-wrapped cluster of tiny rondelles in lavender, grey-blue, leaf green and champagne — the natural colour range of fluorite and amethyst gathered into one bloom.\n\nWorn, the larger stone swings gently while the cluster catches the light from every angle, scattering soft glints of gold wire between the beads.\n\nFluorite is traditionally carried as a stone of focus — said to settle a busy mind and draw scattered thoughts back to centre.\n\nFinished on 14k gold-plated sterling silver (S925) ear hooks, which are hypoallergenic, with gold-plated alloy findings. Each pair is assembled by hand and natural stone varies slightly, so no two pairs are identical.",
      category: "JEWELLERY",
      subcategory: "EARRINGS",
      materials: "natural crystal, 14k gold-plated S925 silver hooks, gold-plated alloy findings",
      price: 33.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Comet",
      intention: "Focus",
      images: [
        {
          url: "/products/comet/green-fluorite-cluster-drop-earrings-hero.jpg",
          altText:
            "Green fluorite cluster drop earrings photographed with the Tengology mark",
        },
        {
          url: "/products/comet/try-on/imagegen/green-fluorite-cluster-drop-earrings-try-on.png",
          altText:
            "Close-up ear model wearing a green fluorite cluster drop earring",
        },
      ],
    },
    {
      slug: "milky-quartz-cluster-earrings",
      title: "Milky Quartz Cluster Earrings — Sea Mist",
      shortDescription:
        "A milky quartz nugget drop beneath a cascading cluster of aqua amazonite and misty aquamarine, hand-wrapped in gold for a soft sea-glass shimmer.",
      fullDescription:
        "A softly clouded nugget of milky quartz anchors each earring, its polished, glassy surface glowing over wisps of white held within the stone. Above it, a hand-wrapped cluster of faceted rondelles tumbles in bright aqua amazonite and misty grey-blue aquamarine — like surf settling over pale river stone.\n\nWorn, the cluster shifts with every turn of the head: the faceted beads glint in changing light while the quartz drop swings gently below, a quiet shimmer rather than a flash. In crystal tradition, milky quartz and aquamarine are kept as stones of calm — worn with the intention of stillness amid a busy day.\n\nFinished on hypoallergenic 14k gold-plated sterling silver (S925) ear hooks with gold-plated alloy findings. Each pair is assembled by hand, and natural stone varies slightly in tone and shape, so no two pairs are ever identical.",
      category: "JEWELLERY",
      subcategory: "EARRINGS",
      materials: "natural crystal, 14k gold-plated S925 silver hooks, gold-plated alloy findings",
      price: 33.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Comet",
      intention: "Stillness",
      images: [
        {
          url: "/products/comet/milky-quartz-cluster-earrings-hero.jpg",
          altText:
            "Milky quartz cluster earrings photographed with the Tengology mark",
        },
        {
          url: "/products/comet/try-on/imagegen/milky-quartz-cluster-earrings-try-on.png",
          altText:
            "Close-up ear model wearing a milky quartz cluster earring",
        },
      ],
    },
    {
      slug: "rose-quartz-star-cluster-earrings",
      title: "Rose Quartz Star Cluster Earrings — Soft Starlight",
      shortDescription:
        "Puffed rose quartz star drops beneath a hand-wrapped cluster of aqua amazonite, baroque freshwater pearls and peach beads — a soft pastel pair.",
      fullDescription:
        "A puffed star of rose quartz anchors each earring — milky blush pink and softly translucent, its smooth, pillowy curves catching light in a gentle glow rather than a glitter. Above it sits a hand-wrapped cluster of aqua amazonite rondelles, white baroque freshwater pearls and warm peach beads, gathered like a tiny constellation.\n\nWorn, the stars swing freely beneath the cluster, the pearls flickering and the amazonite flashing seafoam with every turn of the head. Rose quartz is traditionally held as the stone of gentleness and an open heart — a quiet invitation to move through the day with softness.\n\nFinished on sterling silver (S925) ear hooks with silver-tone alloy findings; only the hooks are hypoallergenic. Each pair is assembled by hand, and natural stone varies slightly, so no two pairs are identical.",
      category: "JEWELLERY",
      subcategory: "EARRINGS",
      materials: "natural crystal, freshwater pearl, S925 silver hooks, silver-tone alloy findings",
      price: 32.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Comet",
      intention: "Softness",
      images: [
        {
          url: "/products/comet/rose-quartz-star-cluster-earrings-hero.jpg",
          altText:
            "Rose quartz star cluster earrings photographed with the Tengology mark",
        },
        {
          url: "/products/comet/try-on/imagegen/rose-quartz-star-cluster-earrings-try-on.png",
          altText:
            "Close-up ear model wearing a rose quartz star cluster earring",
        },
      ],
    },
    {
      slug: "smoky-quartz-drop-earrings",
      title: "Smoky Quartz Statement Drop Earrings — Golden Hour",
      shortDescription:
        "Statement smoky quartz drops crowned with raw citrine and a cascade of tiger's eye and hematite, on 14k gold-plated sterling silver hooks.",
      fullDescription:
        "A statement-length drop of polished smoky quartz, cut into a slender, elongated teardrop that shifts from deep espresso to warm amber as light passes through it. At the crown, raw citrine chips glow pale gold, while a fringe of faceted tiger's eye and hematite cubes cascades down fine gold chain.\n\nThese earrings move beautifully — the long drops sway with every turn of the head, and the beaded cascade glints softly against the smooth, glassy stone. Smoky quartz is traditionally held as a grounding, protective stone, said to steady the wearer and quietly absorb what no longer serves.\n\nFinished on hypoallergenic 14k gold-plated sterling silver (S925) ear hooks with gold-plated alloy findings. Each pair is assembled by hand in Oxford, and because natural stone varies slightly, no two pairs are ever quite identical.",
      category: "JEWELLERY",
      subcategory: "EARRINGS",
      materials: "natural crystal, 14k gold-plated S925 silver hooks, gold-plated alloy findings",
      price: 34.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Comet",
      intention: "Protection",
      images: [
        {
          url: "/products/comet/smoky-quartz-drop-earrings-hero.jpg",
          altText:
            "Smoky quartz statement drop earrings photographed with the Tengology mark",
        },
        {
          url: "/products/comet/smoky-quartz-drop-earrings-2.jpg",
          altText:
            "Second view of smoky quartz statement drop earrings with the Tengology mark",
        },
        {
          url: "/products/comet/try-on/imagegen/smoky-quartz-drop-earrings-try-on.png",
          altText:
            "Close-up ear model wearing a smoky quartz statement drop earring",
        },
      ],
    },
    {
      slug: "clear-quartz-star-cluster-earrings",
      title: "Clear Quartz Star Drop Earrings — Starlit Cluster",
      shortDescription:
        "A carved clear quartz star swings beneath a cluster of black spinel, aquamarine and labradorite rondelles on 14k gold-plated S925 hooks.",
      fullDescription:
        "A carved clear quartz star hangs beneath a gathered cluster of faceted rondelles — inky black spinel, pale aquamarine blue and the soft grey-green sheen of labradorite — each bead wrapped by hand in gold-toned wire. The quartz is wonderfully transparent, its gently carved points letting light pass straight through.\n\nWorn, the cluster sits close to the ear while the star swings freely below, scattering daylight with every turn of the head. In crystal tradition, clear quartz is regarded as a stone of clarity — worn with the intention of steadying the mind and bringing focus to what matters.\n\nFinished on hypoallergenic 14k gold-plated sterling silver (S925) ear hooks with gold-plated alloy findings.\n\nEach pair is assembled by hand, and natural stone varies slightly in tone and clarity — no two pairs are ever quite identical.",
      category: "JEWELLERY",
      subcategory: "EARRINGS",
      materials: "natural crystal, 14k gold-plated S925 silver hooks, gold-plated alloy findings",
      price: 32.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Comet",
      intention: "Clarity",
      images: [
        {
          url: "/products/comet/clear-quartz-star-cluster-earrings-hero.jpg",
          altText:
            "Clear quartz star cluster earrings photographed with the Tengology mark",
        },
        {
          url: "/products/comet/try-on/imagegen/clear-quartz-star-cluster-earrings-try-on.png",
          altText:
            "Close-up ear model wearing a clear quartz star cluster earring",
        },
      ],
    },
    {
      slug: "pearl-carnelian-cluster-earrings",
      title: "Freshwater Pearl & Carnelian Cluster Earrings — Sunset Glow",
      shortDescription:
        "Baroque freshwater pearl drops crowned with a sunset cluster of carnelian, peach and champagne quartz beads on gold-plated sterling silver hooks.",
      fullDescription:
        "A luminous white baroque coin pearl hangs beneath a little sunset — faceted beads graded from deep red-orange carnelian through soft peach to clear champagne quartz, each one hand-wired into a cluster and brightened with tiny gold sequins.\n\nThe pearl's gently rippled surface holds light the way water does, while the faceted gradient above flickers with every turn of the head — warm sparks against cool lustre.\n\nCarnelian is traditionally worn as a stone of vitality and warmth, an intention of energy for days that ask a little more of you.\n\nFinished on 14k gold-plated sterling silver (S925) ear hooks — gentle on sensitive ears — with gold-plated alloy findings. Each pair is assembled by hand, and natural pearl and stone vary slightly, so no two pairs are identical.",
      category: "JEWELLERY",
      subcategory: "EARRINGS",
      materials: "freshwater pearl, natural crystal, 14k gold-plated S925 silver hooks, gold-plated alloy findings",
      price: 34.0,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Comet",
      intention: "Energy",
      images: [
        {
          url: "/products/comet/pearl-carnelian-cluster-earrings-hero.jpg",
          altText:
            "Pearl and carnelian cluster earrings photographed with the Tengology mark",
        },
        {
          url: "/products/comet/try-on/imagegen/pearl-carnelian-cluster-earrings-try-on.png",
          altText:
            "Close-up ear model wearing a pearl and carnelian cluster earring",
        },
      ],
    },

    // ─── Other existing seed entries (no photos yet) ─────
    {
      slug: "sage-green-felt-leaf-earrings",
      title: "Sage Green Felt Leaf Earrings",
      shortDescription:
        "Lightweight handmade earrings shaped as delicate leaves from sage green felt.",
      fullDescription:
        "These charming leaf earrings are hand-cut from high-quality wool felt in a beautiful sage green. Each leaf is carefully shaped with realistic veining detail.\n\nMounted on hypoallergenic silver-tone hooks, these earrings are incredibly lightweight and comfortable to wear all day.\n\nA nature-inspired piece that adds a touch of handmade charm to any outfit.",
      category: "JEWELLERY",
      materials: "wool felt, hypoallergenic hooks",
      price: 12.0,
      stockCount: 10,
      isPublished: false,
      isFeatured: false,
      collection: "Mama's Garden",
    },
    {
      slug: "wooden-robin-christmas-ornament",
      title: "Hand-Painted Wooden Robin Christmas Ornament",
      shortDescription:
        "A charming hand-painted robin on a wooden disc, perfect for your tree.",
      fullDescription:
        "This adorable Christmas ornament features a hand-painted robin on a smooth wooden disc. Each robin is individually painted with fine detail, giving it real character and charm.\n\nThe ornament comes with a natural jute string for hanging. The wood has been lightly sealed to protect the painting.\n\nA perfect addition to a nature-themed Christmas tree, or a lovely handmade gift for bird lovers.",
      category: "CHRISTMAS_ORNAMENTS",
      materials: "wood, acrylic paint, jute string",
      price: 6.0,
      stockCount: 20,
      isPublished: false,
      isFeatured: false,
      collection: "Festive Cheer",
    },
    {
      slug: "autumn-berry-wool-brooch",
      title: "Autumn Berry Wool Felt Brooch",
      shortDescription:
        "A hand-stitched cluster of berries and leaves in warm autumn tones.",
      fullDescription:
        "This stunning brooch features a hand-stitched cluster of wool felt berries in deep burgundy and warm orange, surrounded by delicate green leaves. Each berry is individually rolled and sewn.\n\nMounted on a quality pin back, this brooch is perfect for adding a pop of handmade colour to coats, scarves, or bags.\n\nA wearable piece of art inspired by the English countryside in autumn.",
      category: "BROOCHES",
      materials: "wool felt, thread, metal pin back",
      price: 14.0,
      stockCount: 8,
      isPublished: false,
      isFeatured: false,
      collection: "Pumpkin Spice",
    },
    {
      slug: "blush-pink-baby-headband",
      title: "Blush Pink Baby Headband with Mini Bow",
      shortDescription:
        "A soft stretchy headband with a tiny wool felt bow, perfect for little ones.",
      fullDescription:
        "This gentle headband is made from soft, stretchy fabric that's comfortable for babies and toddlers. It features a sweet mini bow hand-cut from premium wool felt in blush pink.\n\nThe headband is designed to be gentle on delicate skin and won't leave marks. Available in a one-size-fits-most design that stretches to fit.\n\nA beautiful accessory for everyday wear, photo shoots, or special occasions.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, soft stretchy fabric",
      price: 7.0,
      stockCount: 12,
      isPublished: false,
      isFeatured: false,
      collection: "Bunny Bloom",
    },
  ];

  for (const product of products) {
    const { images, variants, ...productData } = product;

    const upserted = await prisma.product.upsert({
      where: { slug: product.slug },
      update: productData,
      create: productData,
    });

    // Colourway photography joins the main gallery: the catalogue has no
    // variant model, so each colourway shot becomes a labelled gallery image
    // and the prose description names the options.
    const gallery = [...(images ?? [])];
    for (const variant of variants ?? []) {
      if (!variant.imageUrl) continue;
      if (gallery.some((img) => img.url === variant.imageUrl)) continue;
      gallery.push({
        url: variant.imageUrl,
        altText: `${productData.title} — ${variant.name}`,
      });
    }

    if (gallery.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: upserted.id },
      });
      await prisma.productImage.createMany({
        data: gallery.map((img, index) => ({
          productId: upserted.id,
          url: img.url,
          altText: img.altText,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    }
  }
  console.log(`Seeded ${products.length} products`);

  // Create shipping zone
  await prisma.shippingZone.upsert({
    where: { id: "uk-standard" },
    update: {
      name: "UK Standard",
      baseRate: 3.95,
      freeThreshold: 50.0,
    },
    create: {
      id: "uk-standard",
      name: "UK Standard",
      baseRate: 3.95,
      freeThreshold: 50.0,
    },
  });
  console.log("Shipping zone created");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
