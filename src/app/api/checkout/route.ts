import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/format";
import { adjustInventory } from "@/lib/inventory";

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json();
  const { items, shippingAddress, email } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  if (!email && !session?.user?.email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Validate stock and calculate totals
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItems: Array<{
    productId: string;
    productTitleSnapshot: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product not found: ${item.productId}` },
        { status: 400 }
      );
    }
    if (product.stockCount < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.title}` },
        { status: 400 }
      );
    }

    const unitPrice = Number(product.price);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: product.id,
      productTitleSnapshot: product.title,
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal,
    });
  }

  const shippingCost = subtotal >= 50 ? 0 : 3.95;
  const total = subtotal + shippingCost;
  const orderNumber = generateOrderNumber();

  // Create order and decrement stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockCount: { decrement: item.quantity } },
      });
    }

    // Create order
    return tx.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null,
        guestEmail: session?.user?.email || email,
        status: "PENDING",
        subtotal,
        shippingCost,
        taxAmount: 0,
        total,
        shippingAddress: shippingAddress || null,
        items: { create: orderItems },
      },
    });
  });

  // Log inventory changes (outside transaction for speed)
  for (const item of items) {
    adjustInventory({
      productId: item.productId,
      delta: -item.quantity,
      changeType: "SALE",
      note: `Order ${orderNumber}`,
      triggeredBy: session?.user?.id || "guest",
    }).catch(console.error);
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    orderId: order.id,
  });
}
