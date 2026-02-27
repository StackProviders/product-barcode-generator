"use client";

import type { BarcodeFormat } from "@/lib/config";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBarcodePreviews } from "@/hooks/use-barcode-previews";

interface BarcodePreviewGridProps {
  values: string[];
  companyName: string;
  format: BarcodeFormat;
  scale: number;
  height: number;
}

export function BarcodePreviewGrid({
  values,
  companyName,
  format,
  scale,
  height,
}: BarcodePreviewGridProps) {
  const { items, isLoading, hiddenCount } = useBarcodePreviews(values, format, scale, height);
  const safeCompanyName = companyName.trim();

  if (values.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Barcode Preview</CardTitle>
          <CardDescription>Generated barcodes will appear here after submission.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Barcode Preview</CardTitle>
          <CardDescription>Rendered using API-driven `bwip-js` PNG generation.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{values.length} generated</Badge>
          <Badge variant={isLoading ? "default" : "outline"}>
            {isLoading ? "Rendering..." : "Ready"}
          </Badge>
          {hiddenCount > 0 ? <Badge variant="outline">+{hiddenCount} hidden for preview</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
            >
              {safeCompanyName ? (
                <p className="text-center text-xs font-medium text-foreground">{safeCompanyName}</p>
              ) : null}
              <p className="truncate text-xs text-muted-foreground">{item.value}</p>
              <div className="flex min-h-28 items-center justify-center rounded-md border border-border bg-card p-2 dark:bg-white">
                {item.status === "ready" && item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={`Barcode ${item.value}`}
                    className="h-auto max-h-24 w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {item.status === "error" ? item.error : "Loading preview..."}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
