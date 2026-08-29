import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="site-nav-wrap">
      <nav className="site-nav" aria-label="Navegação principal">
        <Link className="site-brand" href="/"><span aria-hidden="true">OS</span><strong>Orquestrador</strong></Link>
        <div className="site-nav-links">
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/#plano">Plano</Link>
        </div>
        <div className="site-nav-actions">
          <ThemeToggle compact />
          <Link className="button button--quiet" href={signedIn ? "/perfil" : "/entrar"}>{signedIn ? "Perfil" : "Entrar"}</Link>
          <Link className="button button--primary" href={signedIn ? "/painel" : "/entrar?intent=signup"}>{signedIn ? "Abrir painel" : "Criar conta"}</Link>
        </div>
      </nav>
    </header>
  );
}
