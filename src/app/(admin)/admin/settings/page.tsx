import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isSquareConfigured } from "@/lib/square";
import { StoreSettings } from "@/components/admin/StoreSettings";

export default async function SettingsPage() {
  const [settings, shippingMethods] = await Promise.all([
    getSettings(),
    prisma.shippingMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }] }),
  ]);

  return (
    <StoreSettings
      settings={settings}
      shippingMethods={shippingMethods}
      squareConnected={isSquareConfigured()}
      emailConnected={Boolean(process.env.RESEND_API_KEY)}
    />
  );
}
