"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MAX_BARCODE_HEIGHT,
  MAX_BARCODE_SCALE,
  MIN_BARCODE_HEIGHT,
  MIN_BARCODE_SCALE,
} from "@/lib/config";
import { parsePrintJob } from "@/lib/print";

interface PrintPageClientProps {
  jobKey: string | null;
}

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 8;
const MIN_ROWS = 1;
const MAX_ROWS = 20;

type PrintQualityMode = "standard" | "high" | "ultra";

const QUALITY_PROFILE: Record<
  PrintQualityMode,
  { label: string; scaleMultiplier: number; heightMultiplier: number }
> = {
  standard: { label: "Standard", scaleMultiplier: 1, heightMultiplier: 1 },
  high: { label: "High", scaleMultiplier: 1.5, heightMultiplier: 1.25 },
  ultra: { label: "Ultra", scaleMultiplier: 2, heightMultiplier: 1.5 },
};

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(value)));

const buildBarcodeImageSrc = (
  value: string,
  format: string,
  scale: number,
  height: number,
): string => {
  const params = new URLSearchParams({
    text: value,
    format,
    scale: String(scale),
    height: String(height),
    includeText: "false",
  });

  return `/api/barcode?${params.toString()}`;
};

const chunk = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const useIsClient = (): boolean =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

export function PrintPageClient({ jobKey }: PrintPageClientProps) {
  const isClient = useIsClient();
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(10);
  const [quality, setQuality] = useState<PrintQualityMode>("high");

  const { job, error } = useMemo(() => {
    if (!jobKey) {
      return { job: null, error: "No print job was provided." };
    }

    if (!isClient) {
      return { job: null, error: null };
    }

    const raw = window.localStorage.getItem(jobKey);
    if (!raw) {
      return { job: null, error: "Print data was not found. Generate barcodes again and retry." };
    }

    const parsed = parsePrintJob(raw);
    if (!parsed) {
      return { job: null, error: "Print data is invalid." };
    }

    return { job: parsed, error: null };
  }, [isClient, jobKey]);

  const effectiveColumns = clampInt(columns, MIN_COLUMNS, MAX_COLUMNS);
  const effectiveRows = clampInt(rows, MIN_ROWS, MAX_ROWS);
  const barcodesPerPage = effectiveColumns * effectiveRows;

  const pages = useMemo(() => {
    if (!job) return [];
    return chunk(job.values, barcodesPerPage);
  }, [barcodesPerPage, job]);

  const formattedDate = useMemo(() => {
    if (!job) return "";
    return new Date(job.createdAt).toLocaleString();
  }, [job]);

  const renderSize = useMemo(() => {
    if (!job) {
      return { scale: MIN_BARCODE_SCALE, height: MIN_BARCODE_HEIGHT };
    }

    const profile = QUALITY_PROFILE[quality];
    return {
      scale: clampInt(
        Math.round(job.scale * profile.scaleMultiplier),
        MIN_BARCODE_SCALE,
        MAX_BARCODE_SCALE,
      ),
      height: clampInt(
        Math.round(job.height * profile.heightMultiplier),
        MIN_BARCODE_HEIGHT,
        MAX_BARCODE_HEIGHT,
      ),
    };
  }, [job, quality]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center p-4 md:p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Print Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.close()} variant="outline">
              Close Tab
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center p-4 md:p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Preparing Print Preview</CardTitle>
            <CardDescription>Loading barcode images for print.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const safeCompanyName = job.companyName.trim();

  return (
    <main className="print-page mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 sm:p-4 md:gap-6 md:p-8">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Print Barcodes</CardTitle>
          <CardDescription>
            Configure rows/columns per page, then print or save as PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{job.values.length} barcodes</Badge>
            <Badge variant="outline">Generated: {formattedDate}</Badge>
            <Badge variant="outline">Quality: {QUALITY_PROFILE[quality].label}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="print-columns">Columns Per Page</Label>
              <Input
                id="print-columns"
                type="number"
                min={MIN_COLUMNS}
                max={MAX_COLUMNS}
                value={effectiveColumns}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  setColumns(Number.isNaN(value) ? MIN_COLUMNS : value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="print-rows">Rows Per Page</Label>
              <Input
                id="print-rows"
                type="number"
                min={MIN_ROWS}
                max={MAX_ROWS}
                value={effectiveRows}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  setRows(Number.isNaN(value) ? MIN_ROWS : value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Barcodes Per Page</Label>
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {barcodesPerPage}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Total Pages</Label>
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {pages.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="print-quality">Print Quality</Label>
              <Select
                value={quality}
                onValueChange={(value) => setQuality(value as PrintQualityMode)}
              >
                <SelectTrigger id="print-quality" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => window.print()}>Print / Save PDF</Button>
            <Button variant="outline" onClick={() => window.close()}>
              Close Tab
            </Button>
          </div>
        </CardContent>
      </Card>

      {pages.map((pageValues, pageIndex) => {
        const gridStyle = {
          "--print-columns": String(effectiveColumns),
        } as CSSProperties;

        return (
          <section key={`print-page-${pageIndex}`} className="print-sheet space-y-2">
            <p className="print-page-label print-safe-text text-xs text-muted-foreground print:hidden">
              Page {pageIndex + 1} of {pages.length}
            </p>
            <div className="print-grid grid gap-2" style={gridStyle}>
              {pageValues.map((value, index) => (
                <article
                  key={`${value}-${index}-${pageIndex}`}
                  className="print-card rounded-md bg-card p-2"
                >
                  {safeCompanyName ? (
                    <p className="print-company print-safe-text text-center text-xs font-medium text-foreground">
                      {safeCompanyName}
                    </p>
                  ) : null}
                  <div className="print-barcode-wrap mt-0.5 flex min-h-16 items-center justify-center rounded-sm p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={buildBarcodeImageSrc(
                        value,
                        job.format,
                        renderSize.scale,
                        renderSize.height,
                      )}
                      alt={`Barcode ${value}`}
                      className="print-barcode-image h-auto w-full object-contain"
                      loading="eager"
                    />
                  </div>
                  <p className="print-number print-safe-text font-semibold truncate text-center text-xs text-foreground">
                    {value}
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
