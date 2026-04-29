import { prisma } from "./db";

export async function adjustInventory({
  productId,
  delta,
  changeType,
  note,
  triggeredBy,
}: {
  productId: string;
  delta: number;
  changeType: string;
  note?: string;
  triggeredBy?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stockCount: true },
    });

    const quantityBefore = product.stockCount;
    const quantityAfter = quantityBefore + delta;

    if (quantityAfter < 0) {
      throw new Error(
        `Insufficient stock: ${quantityBefore} available, tried to remove ${Math.abs(delta)}`
      );
    }

    await tx.product.update({
      where: { id: productId },
      data: { stockCount: quantityAfter },
    });

    await tx.inventoryLog.create({
      data: {
        productId,
        changeType,
        quantityBefore,
        quantityAfter,
        delta,
        note,
        triggeredBy,
      },
    });

    return { quantityBefore, quantityAfter, delta };
  });
}
