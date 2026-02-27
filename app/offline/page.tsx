import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center p-4 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>You Are Offline</CardTitle>
          <CardDescription>
            Network is unavailable. Reconnect and retry barcode rendering or printing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">Back to Generator</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Retry</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
