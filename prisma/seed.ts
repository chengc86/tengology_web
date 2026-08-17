import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  // Create sample products
  const products = [
    {
      slug: "dusty-rose-wool-felt-bow-clip",
      title: "Dusty Rose Wool Felt Bow Hair Clip",
      shortDescription:
        "A delicate handmade bow crafted from premium wool felt in a soft dusty rose.",
      fullDescription:
        "This beautiful hair clip features a hand-cut and hand-stitched bow made from 100% wool felt in our signature dusty rose shade. The bow is mounted on a sturdy crocodile clip that holds securely in all hair types.\n\nEach bow is carefully shaped and finished by hand, making every piece unique. The wool felt has a lovely soft texture and rich colour that won't fade.\n\nPerfect for everyday wear or special occasions. Makes a thoughtful handmade gift.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, metal crocodile clip",
      price: 8.5,
      stockCount: 15,
      isPublished: true,
      isFeatured: true,
      collection: "Bloom & Blossom",
    },
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
      isPublished: true,
      isFeatured: true,
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
      isPublished: true,
      isFeatured: true,
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
      isPublished: true,
      isFeatured: true,
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
      isPublished: true,
      isFeatured: false,
      collection: "Bunny Bloom",
    },
    {
      slug: "strawberry-felt-hair-bobble",
      title: "Strawberry Felt Hair Bobble",
      shortDescription:
        "An adorable hand-stitched strawberry on a strong hair elastic.",
      fullDescription:
        "This fun hair bobble features a hand-stitched strawberry made from red and green wool felt, complete with tiny seed details. The strawberry is securely attached to a strong, snag-free hair elastic.\n\nPerfect for adding a playful touch to ponytails and braids. Popular with both kids and adults who love fruity fashion!\n\nPart of our Tutti Frutti collection.",
      category: "HAIR_ACCESSORIES",
      materials: "wool felt, embroidery thread, hair elastic",
      price: 5.5,
      stockCount: 18,
      isPublished: true,
      isFeatured: true,
      collection: "Tutti Frutti",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products`);

  // Create shipping zone
  await prisma.shippingZone.upsert({
    where: { id: "uk-standard" },
    update: {},
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
