import { PrintPageClient } from "@/components/barcode/print-page-client";

interface PrintPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PrintPage({ searchParams }: PrintPageProps) {
  const params = await searchParams;
  const jobParam = params.job;
  const jobKey = Array.isArray(jobParam) ? jobParam[0] : jobParam;

  return <PrintPageClient jobKey={jobKey ?? null} />;
}
