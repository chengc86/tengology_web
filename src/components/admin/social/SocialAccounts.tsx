"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "PINTEREST"] as const;

const PLATFORM_META: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  INSTAGRAM: {
    icon: <span className="text-sm font-bold">IG</span>,
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    description: "Share product photos and reels",
  },
  FACEBOOK: {
    icon: <span className="text-sm font-bold">FB</span>,
    color: "bg-blue-600",
    description: "Engage your community with posts",
  },
  TIKTOK: {
    icon: <span className="text-sm font-bold">TT</span>,
    color: "bg-black",
    description: "Short-form video content",
  },
  X: {
    icon: <span className="text-sm font-bold">X</span>,
    color: "bg-neutral-900",
    description: "Quick updates and conversations",
  },
  PINTEREST: {
    icon: <span className="text-sm font-bold">P</span>,
    color: "bg-red-600",
    description: "Pin products for discovery",
  },
};

interface Account {
  id: string;
  platform: string;
  accountName: string;
  isConnected: boolean;
  tokenExpiry: string | null;
}

export function SocialAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const res = await fetch("/api/admin/social/accounts");
    const data = await res.json();
    setAccounts(data.accounts || []);
    setLoading(false);
  }

  async function addAccount() {
    if (!newPlatform || !newAccountName) return;

    await fetch("/api/admin/social/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: newPlatform,
        accountName: newAccountName,
      }),
    });

    setDialogOpen(false);
    setNewPlatform("");
    setNewAccountName("");
    await fetchAccounts();
  }

  async function removeAccount(id: string) {
    await fetch("/api/admin/social/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAccounts();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to enable auto-posting.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4" />
            Add Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Social Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select platform..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Name / Handle</Label>
                <Input
                  placeholder="@youraccount"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addAccount} disabled={!newPlatform || !newAccountName}>
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platform cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const meta = PLATFORM_META[platform];
          const account = accounts.find((a) => a.platform === platform);

          return (
            <Card key={platform}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${meta.color}`}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{platform}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {account ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{account.accountName}</span>
                      <Badge variant={account.isConnected ? "default" : "outline"}>
                        {account.isConnected ? "Connected" : "Not connected"}
                      </Badge>
                    </div>
                    {!account.isConnected && (
                      <p className="text-xs text-muted-foreground">
                        API credentials needed. Add your {platform} API keys in environment variables to enable auto-posting.
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive w-full"
                      onClick={() => removeAccount(account.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No account added yet.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            How to Connect
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            1. Add your account name/handle for each platform above.
          </p>
          <p>
            2. Set up API credentials for each platform (developer accounts required).
          </p>
          <p>
            3. Add the API keys to your environment variables. Once configured, the account status will show as &quot;Connected&quot; and auto-posting will be enabled.
          </p>
          <div className="mt-3 p-3 rounded-md bg-muted text-xs font-mono space-y-1">
            <p># Environment variables needed per platform:</p>
            <p>INSTAGRAM_ACCESS_TOKEN=...</p>
            <p>FACEBOOK_PAGE_TOKEN=...</p>
            <p>TIKTOK_ACCESS_TOKEN=...</p>
            <p>X_API_KEY=... X_API_SECRET=...</p>
            <p>PINTEREST_ACCESS_TOKEN=...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
