"use client";

import { useEffect, useMemo, useReducer } from "react";

import type { BarcodeFormat } from "@/lib/config";

export interface BarcodePreviewItem {
  id: string;
  value: string;
  url: string | null;
  status: "loading" | "ready" | "error";
  error: string | null;
}

export interface BarcodePreviewState {
  items: BarcodePreviewItem[];
  isLoading: boolean;
  hiddenCount: number;
}

const PREVIEW_LIMIT = 120;
const CONCURRENCY = 6;

const createLoadingItems = (values: string[]): BarcodePreviewItem[] =>
  values.map((value, index) => ({
    id: `${value}-${index}`,
    value,
    url: null,
    status: "loading",
    error: null,
  }));

type BarcodePreviewAction =
  | { type: "reset"; values: string[] }
  | { type: "ready"; index: number; url: string }
  | { type: "error"; index: number; error: string };

const itemsReducer = (
  state: BarcodePreviewItem[],
  action: BarcodePreviewAction,
): BarcodePreviewItem[] => {
  if (action.type === "reset") {
    return createLoadingItems(action.values);
  }

  const next = [...state];
  const current = next[action.index];
  if (!current) {
    return state;
  }

  if (action.type === "ready") {
    next[action.index] = {
      ...current,
      url: action.url,
      status: "ready",
      error: null,
    };
    return next;
  }

  next[action.index] = {
    ...current,
    status: "error",
    error: action.error,
  };
  return next;
};

const fetchBarcodeBlob = async (
  value: string,
  format: BarcodeFormat,
  scale: number,
  height: number,
  signal: AbortSignal,
): Promise<Blob> => {
  const response = await fetch("/api/barcode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: value,
      format,
      scale,
      height,
      includeText: true,
    }),
    signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Barcode preview request failed.");
  }

  return response.blob();
};

export const useBarcodePreviews = (
  values: string[],
  format: BarcodeFormat,
  scale: number,
  height: number,
): BarcodePreviewState => {
  const sanitizedValues = useMemo(
    () => values.map((value) => value.trim()).filter((value) => value.length > 0),
    [values],
  );
  const previewValues = useMemo(() => sanitizedValues.slice(0, PREVIEW_LIMIT), [sanitizedValues]);
  const hiddenCount = Math.max(0, sanitizedValues.length - PREVIEW_LIMIT);

  const [items, dispatch] = useReducer(itemsReducer, []);

  useEffect(() => {
    dispatch({ type: "reset", values: previewValues });
    if (previewValues.length === 0) return;

    const abortController = new AbortController();
    const createdUrls: string[] = [];
    let cursor = 0;
    let isActive = true;

    const worker = async () => {
      while (isActive) {
        const currentIndex = cursor;
        cursor += 1;

        if (currentIndex >= previewValues.length) {
          return;
        }

        const value = previewValues[currentIndex];

        try {
          const blob = await fetchBarcodeBlob(
            value,
            format,
            scale,
            height,
            abortController.signal,
          );

          if (!isActive) {
            return;
          }

          const url = URL.createObjectURL(blob);
          createdUrls.push(url);

          dispatch({ type: "ready", index: currentIndex, url });
        } catch (error) {
          if (!isActive || abortController.signal.aborted) {
            return;
          }

          const message = error instanceof Error ? error.message : "Preview generation failed.";
          dispatch({ type: "error", index: currentIndex, error: message });
        }
      }
    };

    const workerCount = Math.min(CONCURRENCY, previewValues.length);
    const workers = Array.from({ length: workerCount }, () => worker());

    void Promise.all(workers);

    return () => {
      isActive = false;
      abortController.abort();
      for (const url of createdUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [format, height, previewValues, scale]);

  return {
    items,
    isLoading: items.some((item) => item.status === "loading"),
    hiddenCount,
  };
};
