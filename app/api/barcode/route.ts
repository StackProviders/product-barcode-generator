import bwipjs from "bwip-js";

import {
  DEFAULT_BARCODE_FORMAT,
  DEFAULT_BARCODE_HEIGHT,
  DEFAULT_BARCODE_SCALE,
  MAX_BARCODE_HEIGHT,
  MAX_BARCODE_SCALE,
  MIN_BARCODE_HEIGHT,
  MIN_BARCODE_SCALE,
  type BarcodeFormat,
} from "@/lib/config";

export const runtime = "nodejs";

interface BarcodePayload {
  text: string;
  format?: BarcodeFormat;
  scale?: number;
  height?: number;
  includeText?: boolean;
}

const isSupportedFormat = (value: string): value is BarcodeFormat =>
  value === "code128" || value === "code39" || value === "ean13";

const parsePayload = async (request: Request): Promise<BarcodePayload> => {
  if (request.method === "GET") {
    const { searchParams } = new URL(request.url);
    return {
      text: searchParams.get("text") ?? "",
      format: (searchParams.get("format") ?? DEFAULT_BARCODE_FORMAT) as BarcodeFormat,
      scale: Number(searchParams.get("scale") ?? String(DEFAULT_BARCODE_SCALE)),
      height: Number(searchParams.get("height") ?? String(DEFAULT_BARCODE_HEIGHT)),
      includeText: searchParams.get("includeText") !== "false",
    };
  }

  const body = (await request.json()) as Partial<BarcodePayload>;
  return {
    text: body.text ?? "",
    format: body.format ?? DEFAULT_BARCODE_FORMAT,
    scale: body.scale ?? DEFAULT_BARCODE_SCALE,
    height: body.height ?? DEFAULT_BARCODE_HEIGHT,
    includeText: body.includeText ?? true,
  };
};

const renderToBuffer = async ({
  text,
  format,
  scale,
  height,
  includeText,
}: Required<BarcodePayload>): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: format,
        text,
        scale,
        height,
        includetext: includeText,
        textxalign: "center",
        backgroundcolor: "FFFFFF",
      },
      (error: string | Error | null, png: Buffer) => {
        if (error) {
          reject(typeof error === "string" ? new Error(error) : error);
          return;
        }

        resolve(png);
      },
    );
  });

const handle = async (request: Request): Promise<Response> => {
  try {
    const payload = await parsePayload(request);
    const text = payload.text.trim();
    const format = payload.format ?? DEFAULT_BARCODE_FORMAT;
    const scale = payload.scale ?? DEFAULT_BARCODE_SCALE;
    const height = payload.height ?? DEFAULT_BARCODE_HEIGHT;
    const includeText = payload.includeText ?? true;

    if (!text) {
      return Response.json(
        { error: "Barcode text is required." },
        {
          status: 400,
        },
      );
    }

    if (!isSupportedFormat(format)) {
      return Response.json(
        { error: "Unsupported barcode format." },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isFinite(scale) ||
      !Number.isInteger(scale) ||
      scale < MIN_BARCODE_SCALE ||
      scale > MAX_BARCODE_SCALE
    ) {
      return Response.json(
        {
          error: `Scale must be a whole number between ${MIN_BARCODE_SCALE} and ${MAX_BARCODE_SCALE}.`,
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isFinite(height) ||
      !Number.isInteger(height) ||
      height < MIN_BARCODE_HEIGHT ||
      height > MAX_BARCODE_HEIGHT
    ) {
      return Response.json(
        {
          error: `Height must be a whole number between ${MIN_BARCODE_HEIGHT} and ${MAX_BARCODE_HEIGHT}.`,
        },
        {
          status: 400,
        },
      );
    }

    const png = await renderToBuffer({
      text,
      format,
      scale,
      height,
      includeText,
    });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown barcode rendering error.";
    return Response.json(
      { error: message },
      {
        status: 500,
      },
    );
  }
};

export const GET = handle;
export const POST = handle;
