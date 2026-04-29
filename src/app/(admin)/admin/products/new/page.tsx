"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiListingAssistant } from "@/components/admin/AiListingAssistant";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const categories = [
  { value: "HAIR_ACCESSORIES", label: "Hair Accessories" },
  { value: "JEWELLERY", label: "Jewellery" },
  { value: "CHRISTMAS_ORNAMENTS", label: "Christmas Ornaments" },
  { value: "BROOCHES", label: "Brooches" },
  { value: "OTHER", label: "Other" },
];

const subcategories: Record<string, { value: string; label: string }[]> = {
  JEWELLERY: [
    { value: "NECKLACES", label: "Necklaces" },
    { value: "BRACELETS", label: "Bracelets" },
    { value: "EARRINGS", label: "Earrings" },
    { value: "RINGS", label: "Rings" },
  ],
};

const intentions = [
  "Connection",
  "Focus",
  "Protection",
  "Clarity",
  "Stillness",
  "Energy",
  "Shielding",
  "Uniqueness",
  "Softness",
  "Optimism",
  "Alignment",
];

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    category: "OTHER",
    subcategory: "",
    materials: "",
    tags: "",
    price: "",
    compareAtPrice: "",
    stockCount: "0",
    collection: "",
    intention: "",
    isPublished: false,
    isFeatured: false,
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
  });

  const update = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleAiGenerated = (data: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    tags: string[];
    materials: string[];
    suggestedCategory: string;
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
  }) => {
    setForm((f) => ({
      ...f,
      title: data.title || f.title,
      shortDescription: data.shortDescription || f.shortDescription,
      fullDescription: data.fullDescription || f.fullDescription,
      category: data.suggestedCategory || f.category,
      materials: data.materials?.join(", ") || f.materials,
      tags: data.tags?.join(", ") || f.tags,
      metaTitle: data.metaTitle || f.metaTitle,
      metaDescription: data.metaDescription || f.metaDescription,
      focusKeyword: data.focusKeyword || f.focusKeyword,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subcategory: form.subcategory || null,
          intention: form.intention || null,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice
            ? parseFloat(form.compareAtPrice)
            : null,
          stockCount: parseInt(form.stockCount),
          materials: form.materials
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const { id } = await res.json();
      router.push(`/admin/products/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/products"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-heading text-2xl font-light">New Product</h1>
      </div>

      {/* AI Assistant */}
      <div className="mb-8">
        <AiListingAssistant onGenerated={handleAiGenerated} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Basic info */}
        <div className="space-y-4">
          <h2 className="text-xs tracking-[0.15em] uppercase font-medium">
            Product Details
          </h2>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.title.length}/80
            </p>
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={form.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.shortDescription.length}/160
            </p>
          </div>

          <div>
            <Label htmlFor="fullDescription">Full Description</Label>
            <Textarea
              id="fullDescription"
              value={form.fullDescription}
              onChange={(e) => update("fullDescription", e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="collection">Collection (optional)</Label>
              <Input
                id="collection"
                value={form.collection}
                onChange={(e) => update("collection", e.target.value)}
                placeholder="e.g. Bloom & Blossom"
              />
            </div>
          </div>

          {subcategories[form.category] && (
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <select
                id="subcategory"
                value={form.subcategory}
                onChange={(e) => update("subcategory", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">Select subcategory...</option>
                {subcategories[form.category].map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.category === "JEWELLERY" && (
            <div>
              <Label htmlFor="intention">Intention (optional)</Label>
              <select
                id="intention"
                value={form.intention}
                onChange={(e) => update("intention", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">Select intention...</option>
                {intentions.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="materials">
              Materials (comma-separated)
            </Label>
            <Input
              id="materials"
              value={form.materials}
              onChange={(e) => update("materials", e.target.value)}
              placeholder="e.g. wool felt, wood, metal clip"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Textarea
              id="tags"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              rows={2}
              placeholder="e.g. hair clip, handmade, wool felt, kids accessories"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.tags.split(",").filter((t) => t.trim()).length}/13 tags
            </p>
          </div>
        </div>

        {/* Pricing & stock */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xs tracking-[0.15em] uppercase font-medium">
            Pricing & Stock
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (&pound;)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="compareAtPrice">
                Compare at Price (&pound;)
              </Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.compareAtPrice}
                onChange={(e) => update("compareAtPrice", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="stockCount">Stock Count</Label>
              <Input
                id="stockCount"
                type="number"
                min="0"
                value={form.stockCount}
                onChange={(e) => update("stockCount", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xs tracking-[0.15em] uppercase font-medium">
            SEO
          </h2>
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={form.metaTitle}
              onChange={(e) => update("metaTitle", e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.metaTitle.length}/60
            </p>
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={form.metaDescription}
              onChange={(e) => update("metaDescription", e.target.value)}
              maxLength={160}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.metaDescription.length}/160
            </p>
          </div>
          <div>
            <Label htmlFor="focusKeyword">Focus Keyword</Label>
            <Input
              id="focusKeyword"
              value={form.focusKeyword}
              onChange={(e) => update("focusKeyword", e.target.value)}
            />
          </div>
        </div>

        {/* Publish options */}
        <div className="space-y-3 border-t pt-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => update("isPublished", e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm">Publish to storefront</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm">Feature on homepage</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="text-xs tracking-[0.1em] uppercase"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
