import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adjustInventory } from "@/lib/inventory";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const { delta, note } = await request.json();

  if (typeof delta !== "number" || delta === 0) {
    return NextResponse.json(
      { error: "Delta must be a non-zero number" },
      { status: 400 }
    );
  }

  try {
    const result = await adjustInventory({
      productId,
      delta,
      changeType: "MANUAL",
      note,
      triggeredBy: session.user.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 }
    );
  }
}
