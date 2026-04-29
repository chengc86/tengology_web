import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const anthropic = new Anthropic();

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "PINTEREST"] as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, platforms, date } = await request.json();

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      tags: { include: { tag: true } },
      seo: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const targetPlatforms = platforms?.length ? platforms : PLATFORMS;
  const postDate = date ? new Date(date) : new Date();

  const tags = product.tags.map((pt) => pt.tag.name).join(", ");
  const primaryImage = product.images[0]?.url || null;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a social media manager for Tengology, a small handmade goods business based in the UK. They sell handcrafted wood, wool felt, and felt hair accessories, jewellery, brooches, and Christmas ornaments. Every piece is unique and handmade.

The brand tone is warm, elegant, and approachable — like a conversation with a talented artisan friend.

Generate social media posts for the following product across these platforms: ${targetPlatforms.join(", ")}.

Product details:
- Title: ${product.title}
- Short description: ${product.shortDescription || "N/A"}
- Full description: ${product.fullDescription || "N/A"}
- Category: ${product.category}
- Materials: ${product.materials || "N/A"}
- Tags: ${tags || "N/A"}
- Price: £${product.price}

For each platform, tailor the content appropriately:
- INSTAGRAM: Visual-focused caption, 3-5 lines, use line breaks. Include 20-30 relevant hashtags separately.
- FACEBOOK: Conversational, slightly longer, community-focused. Include 3-5 hashtags.
- TIKTOK: Short, punchy, trend-aware caption. Include 5-10 hashtags. Suggest a video concept in brackets.
- X: Concise, max 280 chars including hashtags. Include 2-3 hashtags.
- PINTEREST: SEO-rich description for pin. Include 5-10 hashtags.

Return ONLY valid JSON (no markdown, no backticks) as an array:
[
  {
    "platform": "INSTAGRAM",
    "caption": "the caption text",
    "hashtags": "#tag1, #tag2, #tag3",
    "theme": "product spotlight"
  }
]

Choose an appropriate theme from: "product spotlight", "behind the scenes", "materials & craft", "styling tips", "seasonal", "new arrival", "customer favourite".`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const posts = JSON.parse(text) as Array<{
      platform: string;
      caption: string;
      hashtags: string;
      theme: string;
    }>;

    const drafts = await Promise.all(
      posts
        .filter((p) => targetPlatforms.includes(p.platform as typeof PLATFORMS[number]))
        .map((post) =>
          prisma.socialDraft.create({
            data: {
              date: postDate,
              platform: post.platform,
              caption: post.caption,
              hashtags: post.hashtags,
              imageUrl: primaryImage,
              productId: product.id,
              theme: post.theme,
              status: "PENDING",
            },
          })
        )
    );

    return NextResponse.json({ drafts });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw: text },
      { status: 500 }
    );
  }
}
