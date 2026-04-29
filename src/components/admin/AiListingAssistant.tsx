"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface AiListingData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  materials: string[];
  suggestedCategory: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

interface AiListingAssistantProps {
  onGenerated: (data: AiListingData) => void;
}

export function AiListingAssistant({ onGenerated }: AiListingAssistantProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate listing");
      }

      const data = await res.json();
      onGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-md p-4 bg-accent/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-rose" />
        <h3 className="text-sm font-medium">AI Listing Assistant</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Describe your item in your own words and the AI will generate a
        complete product listing for you to review and edit.
      </p>
      <Textarea
        placeholder="e.g. Small red wool felt bow hair clip, about 3cm, great for kids, has a crocodile clip backing..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="mb-3"
      />
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <Button
        onClick={handleGenerate}
        disabled={loading || !description.trim()}
        size="sm"
        className="text-xs"
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-2" />
            Generate Listing
          </>
        )}
      </Button>
    </div>
  );
}
