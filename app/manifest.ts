import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Product Barcode Generator",
    short_name: "Barcode POS",
    description: "POS-focused barcode and serial generator with print-ready output.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "en-US",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
