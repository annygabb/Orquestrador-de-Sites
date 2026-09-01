import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/700.css";
import { headers } from "next/headers";
import "./globals.css";
import "../tokens.css";
import "./panel.css";
import "./marketing.css";
import { CookieConsent } from "@/app/components/cookie-consent";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN || "https://orquestradordesites.vercel.app"),
  title: { default: "Orquestrador de Sites", template: "%s · Orquestrador de Sites" },
  description: "Escolha skills e referências, confirme o processo e aplique ao seu projeto de site com IA.",
  openGraph: { title: "Orquestrador de Sites", description: "Um processo claro para escolher e aplicar skills em projetos de sites com IA.", type: "website", locale: "pt_BR" },
  twitter: { card: "summary", title: "Orquestrador de Sites", description: "Skills e referências organizadas para o seu próximo site." },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('os-theme')||((matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light')}catch(e){}` }} />
      </head>
      <body>{children}<CookieConsent /></body>
    </html>
  );
}
