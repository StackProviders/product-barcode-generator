"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePrintJob } from "@/lib/print";

interface PrintPageClientProps {
  jobKey: string | null;
}

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

const useIsClient = (): boolean =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

export function PrintPageClient({ jobKey }: PrintPageClientProps) {
  const isClient = useIsClient();
  const hasAutoPrintedRef = useRef(false);

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

  useEffect(() => {
    if (!job || hasAutoPrintedRef.current) {
      return;
    }

    hasAutoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [job]);

  const formattedDate = useMemo(() => {
    if (!job) return "";
    return new Date(job.createdAt).toLocaleString();
  }, [job]);

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
    <main className="print-page mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Print Barcodes</CardTitle>
          <CardDescription>
            Use browser print options for direct printer output or Save as PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{job.values.length} barcodes</Badge>
          <Badge variant="outline">Generated: {formattedDate}</Badge>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
          <Button variant="outline" onClick={() => window.close()}>
            Close Tab
          </Button>
        </CardContent>
      </Card>

      <section className="print-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {job.values.map((value, index) => (
          <article
            key={`${value}-${index}`}
            className="print-card rounded-md bg-card p-2"
          >
            {safeCompanyName ? (
              <p className="print-company print-safe-text text-center text-xs font-medium text-foreground">
                {safeCompanyName}
              </p>
            ) : null}
            <div className="print-barcode-wrap mt-1 flex min-h-16 items-center justify-center rounded-sm bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildBarcodeImageSrc(value, job.format, job.scale, job.height)}
                alt={`Barcode ${value}`}
                className="print-barcode-image h-auto w-full object-contain"
                loading="eager"
              />
            </div>
            <p className="print-number print-safe-text mt-1 truncate text-center text-xs text-foreground">
              {value}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
