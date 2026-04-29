import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-light mb-8">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Shipping Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span>UK Standard</span>
                <span>&pound;3.95 (Free over &pound;50)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Additional shipping zones can be configured here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Business:</span>{" "}
              Tengology
            </p>
            <p>
              <span className="text-muted-foreground">Country:</span> United
              Kingdom
            </p>
            <p>
              <span className="text-muted-foreground">Currency:</span> GBP
              (&pound;)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
