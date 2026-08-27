import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/700.css";
import { baseURL } from "@/baseUrl";
import "./globals.css";
import "../tokens.css";
import "./panel.css";

export const metadata: Metadata = {
  title: "Orquestrador de Sites",
  description: "Selecione e confirme as skills usadas no seu projeto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <base href={baseURL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
