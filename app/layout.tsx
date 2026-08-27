import type { Metadata } from "next";
import { baseURL } from "@/baseUrl";
import "./globals.css";

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
