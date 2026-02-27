"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Building2, Github, LifeBuoy } from "lucide-react";

import type { BarcodeGeneratorConfigInput, ConfigField } from "@/lib/config";
import {
  DEFAULT_BARCODE_FORMAT,
  DEFAULT_BARCODE_HEIGHT,
  DEFAULT_BARCODE_SCALE,
  DEFAULT_GENERATION_MODE,
} from "@/lib/config";
import { BarcodeConfigError, generateBarcodes } from "@/lib/generator";
import { createPrintJobKey } from "@/lib/print";

import { BarcodeConfigForm, type BarcodeFormValues } from "@/components/barcode/barcode-config-form";
import { BarcodePreviewGrid } from "@/components/barcode/barcode-preview-grid";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

type FieldErrorMap = Partial<Record<ConfigField, string>>;

const DEFAULT_FORM_VALUES: BarcodeFormValues = {
  companyName: "",
  prefix: "",
  format: DEFAULT_BARCODE_FORMAT,
  mode: DEFAULT_GENERATION_MODE,
  quantity: "24",
  rangeStart: "1",
  rangeEnd: "100",
  scale: String(DEFAULT_BARCODE_SCALE),
  height: String(DEFAULT_BARCODE_HEIGHT),
};

const parseIntegerInput = (value: string): number | undefined => {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toConfigInput = (formValues: BarcodeFormValues): BarcodeGeneratorConfigInput => ({
  companyName: formValues.companyName,
  prefix: formValues.prefix,
  format: formValues.format,
  mode: formValues.mode,
  quantity: parseIntegerInput(formValues.quantity),
  rangeStart: parseIntegerInput(formValues.rangeStart),
  rangeEnd: parseIntegerInput(formValues.rangeEnd),
  scale: parseIntegerInput(formValues.scale),
  height: parseIntegerInput(formValues.height),
});

const toErrorMap = (error: BarcodeConfigError): FieldErrorMap => {
  const map: FieldErrorMap = {};

  for (const item of error.errors) {
    if (!map[item.field]) {
      map[item.field] = item.message;
    }
  }

  return map;
};

export function BarcodeGeneratorApp() {
  const [formValues, setFormValues] = useState<BarcodeFormValues>(DEFAULT_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRenderPreview = useMemo(() => barcodes.length > 0, [barcodes.length]);
  const resolvedScale = useMemo(
    () => parseIntegerInput(formValues.scale) ?? DEFAULT_BARCODE_SCALE,
    [formValues.scale],
  );
  const resolvedHeight = useMemo(
    () => parseIntegerInput(formValues.height) ?? DEFAULT_BARCODE_HEIGHT,
    [formValues.height],
  );

  const updateField = <K extends keyof BarcodeFormValues>(field: K, value: BarcodeFormValues[K]) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const resetAll = () => {
    setFormValues(DEFAULT_FORM_VALUES);
    setFieldErrors({});
    setGlobalError(null);
    setBarcodes([]);
  };

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setGlobalError(null);
    setFieldErrors({});

    try {
      const generated = await generateBarcodes(toConfigInput(formValues));
      setBarcodes(generated);
    } catch (error) {
      if (error instanceof BarcodeConfigError) {
        setFieldErrors(toErrorMap(error));
      } else {
        const message =
          error instanceof Error ? error.message : "Unexpected error while generating barcodes.";
        setGlobalError(message);
      }
      setBarcodes([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (barcodes.length === 0) {
      return;
    }

    const key = createPrintJobKey();
    const payload = {
      companyName: formValues.companyName.trim(),
      format: formValues.format,
      scale: resolvedScale,
      height: resolvedHeight,
      values: barcodes,
      createdAt: Date.now(),
    };

    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
      const printWindow = window.open(`/print?job=${encodeURIComponent(key)}`, "_blank", "noopener");

      if (!printWindow) {
        setGlobalError(
          "Could not open print window. Allow pop-ups for this site and try again.",
        );
      }
    } catch {
      setGlobalError("Print preparation failed. Check browser storage permissions and try again.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardAction>
            <div className="flex items-center gap-2">
              <PwaInstallButton />
              <ThemeToggle />
            </div>
          </CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Built by StackProviders</Badge>
            <Badge variant="outline">Agency Product Engineering</Badge>
          </div>
          <CardTitle className="text-2xl">Product Barcode Generator</CardTitle>
          <CardDescription className="max-w-3xl">
            Enterprise-ready POS barcode and serial generation platform for operations teams that
            need fast generation, reliable print workflows, and scalable architecture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <article className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/20 p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Agency Spotlight</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  StackProviders builds production-grade products for agencies, startups, and
                  enterprise operations teams. This project is one of our open implementations of a
                  practical POS barcode pipeline.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Open Source</Badge>
                  <Badge variant="outline">Production Pattern</Badge>
                  <Badge variant="outline">POS Workflow</Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button variant="outline" asChild>
                  <Link href="https://github.com/StackProviders" target="_blank" rel="noreferrer">
                    <Github className="size-4" />
                    Agency Profile
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    href="https://github.com/StackProviders/product-barcode-generator/issues"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <LifeBuoy className="size-4" />
                    Issues / Support
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    href="https://github.com/StackProviders/product-barcode-generator"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Project
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </CardContent>
      </Card>

      <BarcodeConfigForm
        values={formValues}
        errors={fieldErrors}
        isSubmitting={isSubmitting}
        canPrint={barcodes.length > 0}
        onChange={updateField}
        onSubmit={handleGenerate}
        onPrint={handlePrint}
        onReset={resetAll}
      />

      {globalError ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{globalError}</p>
          </CardContent>
        </Card>
      ) : null}

      {canRenderPreview ? (
        <BarcodePreviewGrid
          values={barcodes}
          companyName={formValues.companyName}
          format={formValues.format}
          scale={resolvedScale}
          height={resolvedHeight}
        />
      ) : (
        <BarcodePreviewGrid
          values={[]}
          companyName={formValues.companyName}
          format={formValues.format}
          scale={resolvedScale}
          height={resolvedHeight}
        />
      )}
    </div>
  );
}
