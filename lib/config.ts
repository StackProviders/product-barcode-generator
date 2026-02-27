export const BARCODE_FORMATS = ["code128", "code39", "ean13"] as const;

export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];

export const GENERATION_MODES = ["timestamp", "range"] as const;

export type GenerationMode = (typeof GENERATION_MODES)[number];

export const DEFAULT_BARCODE_FORMAT: BarcodeFormat = "code128";
export const DEFAULT_GENERATION_MODE: GenerationMode = "timestamp";
export const DEFAULT_TIMESTAMP_QUANTITY = 12;
export const DEFAULT_BARCODE_SCALE = 3;
export const DEFAULT_BARCODE_HEIGHT = 12;
export const MIN_BARCODE_SCALE = 1;
export const MAX_BARCODE_SCALE = 8;
export const MIN_BARCODE_HEIGHT = 8;
export const MAX_BARCODE_HEIGHT = 40;
export const MAX_BARCODE_BATCH = 5000;

export interface BarcodeGeneratorConfigInput {
  companyName?: string;
  prefix?: string;
  format?: BarcodeFormat;
  mode?: GenerationMode;
  quantity?: number;
  rangeStart?: number;
  rangeEnd?: number;
  scale?: number;
  height?: number;
  companyId?: string;
  tenantId?: string;
}

export interface BarcodeGeneratorConfig {
  companyName: string;
  prefix: string;
  format: BarcodeFormat;
  mode: GenerationMode;
  quantity: number;
  rangeStart: number;
  rangeEnd: number;
  scale: number;
  height: number;
  companyId?: string;
  tenantId?: string;
}

export type ConfigField =
  | "companyName"
  | "prefix"
  | "format"
  | "mode"
  | "quantity"
  | "rangeStart"
  | "rangeEnd"
  | "scale"
  | "height";

export interface ConfigValidationError {
  field: ConfigField;
  message: string;
}

export interface ConfigValidationResult {
  config: BarcodeGeneratorConfig | null;
  errors: ConfigValidationError[];
}

export interface BarcodeValidationContext {
  index: number;
  config: BarcodeGeneratorConfig;
}

export type UniqueBarcodeValidator = (
  barcode: string,
  context: BarcodeValidationContext,
) => boolean | Promise<boolean>;

export interface ChecksumStrategy {
  name: string;
  apply(value: string): string;
}

export const sanitizePrefix = (prefix: string | undefined): string => {
  if (!prefix) {
    return "";
  }

  return prefix.trim().replace(/\s+/g, "").toUpperCase();
};

const isFiniteInteger = (value: number | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);

export const validateGeneratorConfig = (
  input: BarcodeGeneratorConfigInput,
): ConfigValidationResult => {
  const errors: ConfigValidationError[] = [];
  const companyName = (input.companyName ?? "").trim();
  const prefix = sanitizePrefix(input.prefix);
  const format = input.format ?? DEFAULT_BARCODE_FORMAT;
  const mode = input.mode ?? DEFAULT_GENERATION_MODE;

  if (!BARCODE_FORMATS.includes(format)) {
    errors.push({ field: "format", message: "Selected barcode format is not supported." });
  }

  if (!GENERATION_MODES.includes(mode)) {
    errors.push({ field: "mode", message: "Selected generation mode is not supported." });
  }

  const quantity = input.quantity ?? DEFAULT_TIMESTAMP_QUANTITY;
  const rangeStart = input.rangeStart ?? 1;
  const rangeEnd = input.rangeEnd ?? 1;
  const scale = input.scale ?? DEFAULT_BARCODE_SCALE;
  const height = input.height ?? DEFAULT_BARCODE_HEIGHT;

  if (mode === "timestamp") {
    if (!isFiniteInteger(quantity) || quantity <= 0) {
      errors.push({ field: "quantity", message: "Quantity must be a positive whole number." });
    } else if (quantity > MAX_BARCODE_BATCH) {
      errors.push({
        field: "quantity",
        message: `Quantity cannot exceed ${MAX_BARCODE_BATCH}.`,
      });
    }
  }

  if (mode === "range") {
    if (!isFiniteInteger(rangeStart) || rangeStart < 0) {
      errors.push({
        field: "rangeStart",
        message: "Range start must be a whole number greater than or equal to 0.",
      });
    }

    if (!isFiniteInteger(rangeEnd) || rangeEnd < 0) {
      errors.push({
        field: "rangeEnd",
        message: "Range end must be a whole number greater than or equal to 0.",
      });
    }

    if (isFiniteInteger(rangeStart) && isFiniteInteger(rangeEnd)) {
      if (rangeEnd < rangeStart) {
        errors.push({
          field: "rangeEnd",
          message: "Range end must be greater than or equal to range start.",
        });
      }

      const length = rangeEnd - rangeStart + 1;
      if (length > MAX_BARCODE_BATCH) {
        errors.push({
          field: "rangeEnd",
          message: `Range cannot generate more than ${MAX_BARCODE_BATCH} barcodes.`,
        });
      }
    }
  }

  if (!isFiniteInteger(scale) || scale < MIN_BARCODE_SCALE || scale > MAX_BARCODE_SCALE) {
    errors.push({
      field: "scale",
      message: `Scale must be a whole number between ${MIN_BARCODE_SCALE} and ${MAX_BARCODE_SCALE}.`,
    });
  }

  if (!isFiniteInteger(height) || height < MIN_BARCODE_HEIGHT || height > MAX_BARCODE_HEIGHT) {
    errors.push({
      field: "height",
      message: `Height must be a whole number between ${MIN_BARCODE_HEIGHT} and ${MAX_BARCODE_HEIGHT}.`,
    });
  }

  if (errors.length > 0) {
    return { config: null, errors };
  }

  return {
    config: {
      companyName,
      prefix,
      format,
      mode,
      quantity,
      rangeStart,
      rangeEnd,
      scale,
      height,
      companyId: input.companyId,
      tenantId: input.tenantId,
    },
    errors,
  };
};
