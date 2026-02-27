import {
  BARCODE_FORMATS,
  DEFAULT_BARCODE_FORMAT,
  DEFAULT_BARCODE_HEIGHT,
  DEFAULT_BARCODE_SCALE,
  type BarcodeFormat,
} from "@/lib/config";

export interface BarcodePrintJob {
  companyName: string;
  format: BarcodeFormat;
  scale: number;
  height: number;
  values: string[];
  createdAt: number;
}

export const createPrintJobKey = (): string => `barcode-print-${Date.now()}`;

export const parsePrintJob = (payload: string): BarcodePrintJob | null => {
  try {
    const candidate = JSON.parse(payload) as Partial<BarcodePrintJob>;
    const format = BARCODE_FORMATS.includes(candidate.format as BarcodeFormat)
      ? (candidate.format as BarcodeFormat)
      : DEFAULT_BARCODE_FORMAT;

    const scale =
      typeof candidate.scale === "number" && Number.isFinite(candidate.scale)
        ? Math.trunc(candidate.scale)
        : DEFAULT_BARCODE_SCALE;
    const height =
      typeof candidate.height === "number" && Number.isFinite(candidate.height)
        ? Math.trunc(candidate.height)
        : DEFAULT_BARCODE_HEIGHT;
    const values = Array.isArray(candidate.values)
      ? candidate.values.filter((value): value is string => typeof value === "string")
      : [];

    if (values.length === 0) {
      return null;
    }

    return {
      companyName: typeof candidate.companyName === "string" ? candidate.companyName : "",
      format,
      scale,
      height,
      values,
      createdAt:
        typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt)
          ? candidate.createdAt
          : Date.now(),
    };
  } catch {
    return null;
  }
};
