"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Sparkles,
  Loader2,
  Trash2,
  Send,
} from "lucide-react";

const PLATFORMS = ["ALL", "INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "PINTEREST"] as const;

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  INSTAGRAM: <span className="text-xs font-bold">IG</span>,
  FACEBOOK: <span className="text-xs font-bold">FB</span>,
  TIKTOK: <span className="text-xs font-bold">TT</span>,
  X: <span className="text-xs font-bold">X</span>,
  PINTEREST: <span className="text-xs font-bold">P</span>,
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  POSTED: "secondary",
};

interface Draft {
  id: string;
  date: string;
  platform: string;
  caption: string;
  hashtags: string;
  imageUrl: string | null;
  productId: string | null;
  theme: string | null;
  status: string;
  product?: { id: string; title: string; images?: Array<{ url: string }> } | null;
}

interface Props {
  products: Array<{ id: string; title: string }>;
}

export function SocialDrafts({ products }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");

  const fetchDrafts = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== "ALL") params.set("status", filterStatus);
    if (filterPlatform && filterPlatform !== "ALL") params.set("platform", filterPlatform);

    const res = await fetch(`/api/admin/social/drafts?${params}`);
    const data = await res.json();
    setDrafts(data.drafts || []);
    setLoading(false);
  }, [filterStatus, filterPlatform]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  async function handleGenerate() {
    if (!selectedProduct) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct }),
      });
      if (res.ok) {
        await fetchDrafts();
        setSelectedProduct("");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function updateDraft(id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/social/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchDrafts();
    setEditingId(null);
  }

  async function deleteDraft(id: string) {
    await fetch(`/api/admin/social/drafts/${id}`, { method: "DELETE" });
    await fetchDrafts();
  }

  async function postDraft(id: string) {
    const res = await fetch("/api/admin/social/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to post");
      return;
    }
    alert(data.message);
    await updateDraft(id, { status: "POSTED" });
  }

  return (
    <div className="space-y-6">
      {/* Generate section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Generate AI Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedProduct || generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate for All Platforms"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            AI will generate tailored captions and hashtags for each platform based on your product information.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="POSTED">Posted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPlatform} onValueChange={(v) => setFilterPlatform(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "ALL" ? "All platforms" : p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drafts list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : drafts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No drafts yet. Select a product above and generate content.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        {PLATFORM_ICONS[draft.platform]}
                        {draft.platform}
                      </span>
                      <Badge variant={STATUS_VARIANT[draft.status] || "outline"}>
                        {draft.status}
                      </Badge>
                      {draft.theme && (
                        <Badge variant="secondary">{draft.theme}</Badge>
                      )}
                      {draft.product && (
                        <span className="text-xs text-muted-foreground">
                          {draft.product.title}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(draft.date).toLocaleDateString("en-GB")}
                      </span>
                    </div>

                    {/* Caption */}
                    {editingId === draft.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          rows={4}
                        />
                        <Textarea
                          value={editHashtags}
                          onChange={(e) => setEditHashtags(e.target.value)}
                          placeholder="Hashtags"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateDraft(draft.id, {
                                caption: editCaption,
                                hashtags: editHashtags,
                              })
                            }
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-sm whitespace-pre-line cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors"
                          onClick={() => {
                            setEditingId(draft.id);
                            setEditCaption(draft.caption);
                            setEditHashtags(draft.hashtags);
                          }}
                        >
                          {draft.caption}
                        </p>
                        {draft.hashtags && (
                          <p className="text-xs text-muted-foreground">
                            {draft.hashtags}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Image thumbnail */}
                  {draft.imageUrl && (
                    <img
                      src={draft.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                  )}
                </div>

                {/* Actions */}
                {draft.status === "PENDING" && editingId !== draft.id && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDraft(draft.id, { status: "APPROVED" })}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDraft(draft.id, { status: "REJECTED" })}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      onClick={() => deleteDraft(draft.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {draft.status === "APPROVED" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button size="sm" onClick={() => postDraft(draft.id)}>
                      <Send className="h-3.5 w-3.5" />
                      Post Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDraft(draft.id, { status: "PENDING" })}
                    >
                      Back to Pending
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      onClick={() => deleteDraft(draft.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
