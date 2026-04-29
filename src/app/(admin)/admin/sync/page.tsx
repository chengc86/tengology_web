import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SyncPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-light mb-8">
        Sync &amp; Integrations
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Square */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Square POS</CardTitle>
              <Badge variant="secondary">Not Connected</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Square account to sync inventory with your
              point-of-sale system. After a craft show, pull in sales to
              automatically update your website stock.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Set up your Square Developer Account first, then come back to
              connect.
            </p>
          </CardContent>
        </Card>

        {/* Etsy */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Etsy</CardTitle>
              <Badge variant="secondary">Not Connected</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Etsy shop to sync listings and inventory. Products
              created here can be pushed to Etsy, and Etsy orders will appear
              in your order dashboard.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Etsy integration will be activated once OAuth is configured.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
