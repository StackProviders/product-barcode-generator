"use client";

import type { BarcodeFormat, ConfigField, GenerationMode } from "@/lib/config";
import {
  BARCODE_FORMATS,
  GENERATION_MODES,
  MAX_BARCODE_HEIGHT,
  MAX_BARCODE_SCALE,
  MIN_BARCODE_HEIGHT,
  MIN_BARCODE_SCALE,
} from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export interface BarcodeFormValues {
  companyName: string;
  prefix: string;
  format: BarcodeFormat;
  mode: GenerationMode;
  quantity: string;
  rangeStart: string;
  rangeEnd: string;
  scale: string;
  height: string;
}

type FieldErrorMap = Partial<Record<ConfigField, string>>;

interface BarcodeConfigFormProps {
  values: BarcodeFormValues;
  errors: FieldErrorMap;
  isSubmitting: boolean;
  canPrint: boolean;
  onChange: <K extends keyof BarcodeFormValues>(field: K, value: BarcodeFormValues[K]) => void;
  onSubmit: () => void;
  onPrint: () => void;
  onReset: () => void;
}

const MODE_LABELS: Record<GenerationMode, string> = {
  timestamp: "Timestamp",
  range: "Range",
};

const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  code128: "CODE128",
  code39: "CODE39",
  ean13: "EAN13",
};

const renderFieldError = (message: string | undefined) => {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
};

export function BarcodeConfigForm({
  values,
  errors,
  isSubmitting,
  canPrint,
  onChange,
  onSubmit,
  onPrint,
  onReset,
}: BarcodeConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Barcode Configuration</CardTitle>
        <CardDescription>Generate barcodes for POS inventory and serial tracking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name (Optional)</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Acme Retail LLC"
              value={values.companyName}
              onChange={(event) => onChange("companyName", event.target.value)}
            />
            {renderFieldError(errors.companyName)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefix">Prefix (Optional)</Label>
            <Input
              id="prefix"
              name="prefix"
              placeholder="POS"
              value={values.prefix}
              onChange={(event) => onChange("prefix", event.target.value)}
            />
            {renderFieldError(errors.prefix)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Barcode Format</Label>
            <Select
              value={values.format}
              onValueChange={(value) => onChange("format", value as BarcodeFormat)}
            >
              <SelectTrigger id="format" className="w-full">
                <SelectValue placeholder="Choose a format" />
              </SelectTrigger>
              <SelectContent>
                {BARCODE_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {FORMAT_LABELS[format]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldError(errors.format)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Generation Mode</Label>
            <Select
              value={values.mode}
              onValueChange={(value) => onChange("mode", value as GenerationMode)}
            >
              <SelectTrigger id="mode" className="w-full">
                <SelectValue placeholder="Choose a mode" />
              </SelectTrigger>
              <SelectContent>
                {GENERATION_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldError(errors.mode)}
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scale">Barcode Scale</Label>
            <Input
              id="scale"
              name="scale"
              type="number"
              min={MIN_BARCODE_SCALE}
              max={MAX_BARCODE_SCALE}
              value={values.scale}
              onChange={(event) => onChange("scale", event.target.value)}
            />
            {renderFieldError(errors.scale)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Barcode Height</Label>
            <Input
              id="height"
              name="height"
              type="number"
              min={MIN_BARCODE_HEIGHT}
              max={MAX_BARCODE_HEIGHT}
              value={values.height}
              onChange={(event) => onChange("height", event.target.value)}
            />
            {renderFieldError(errors.height)}
          </div>
        </div>

        <Separator />

        {values.mode === "timestamp" ? (
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={5000}
              value={values.quantity}
              onChange={(event) => onChange("quantity", event.target.value)}
            />
            {renderFieldError(errors.quantity)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rangeStart">Range Start</Label>
              <Input
                id="rangeStart"
                name="rangeStart"
                type="number"
                min={0}
                value={values.rangeStart}
                onChange={(event) => onChange("rangeStart", event.target.value)}
              />
              {renderFieldError(errors.rangeStart)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rangeEnd">Range End</Label>
              <Input
                id="rangeEnd"
                name="rangeEnd"
                type="number"
                min={0}
                value={values.rangeEnd}
                onChange={(event) => onChange("rangeEnd", event.target.value)}
              />
              {renderFieldError(errors.rangeEnd)}
            </div>
          </div>
        )}

        <div className="flex justify-end flex-wrap gap-3">
          <Button variant="outline" onClick={onReset} disabled={isSubmitting}>
            Reset
          </Button>
          <Button variant="secondary" onClick={onPrint} disabled={isSubmitting || !canPrint}>
            Print
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate Barcodes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
