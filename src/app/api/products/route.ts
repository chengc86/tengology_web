import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/format";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    title,
    shortDescription,
    fullDescription,
    category,
    subcategory,
    materials,
    tags,
    price,
    compareAtPrice,
    stockCount,
    collection,
    intention,
    isPublished,
    isFeatured,
    metaTitle,
    metaDescription,
    focusKeyword,
  } = body;

  if (!title || !price) {
    return NextResponse.json(
      { error: "Title and price are required" },
      { status: 400 }
    );
  }

  // Generate unique slug
  let slug = slugify(title);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const product = await prisma.product.create({
    data: {
      slug,
      title,
      shortDescription: shortDescription || null,
      fullDescription: fullDescription || null,
      category: category || "OTHER",
      subcategory: subcategory || null,
      materials: materials || [],
      price,
      compareAtPrice: compareAtPrice || null,
      stockCount: stockCount || 0,
      collection: collection || null,
      intention: intention || null,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false,
      ...(metaTitle || metaDescription || focusKeyword
        ? {
            seo: {
              create: {
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                focusKeyword: focusKeyword || null,
              },
            },
          }
        : {}),
    },
  });

  // Create tags
  if (tags?.length) {
    for (const tagName of tags) {
      const tagSlug = slugify(tagName);
      if (!tagSlug) continue;

      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        create: { name: tagName, slug: tagSlug },
        update: {},
      });

      await prisma.productTag.create({
        data: { productId: product.id, tagId: tag.id },
      });
    }
  }

  return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 });
}
