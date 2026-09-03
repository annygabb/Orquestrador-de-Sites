import { SiteHeader } from "./site-header";
import Link from "next/link";

export function LegalPage({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return <><SiteHeader /><main className="legal-page"><header><p>Documento do produto</p><h1>{title}</h1><span>{summary}</span><small>Minuta de produto, sujeita a revisão jurídica antes do lançamento comercial.</small></header><article>{children}</article><nav aria-label="Documentos relacionados"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos de uso</Link><Link href="/reembolso">Reembolso</Link><Link href="/cookies">Cookies</Link></nav></main></>;
}
