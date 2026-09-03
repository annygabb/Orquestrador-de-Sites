"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Layers3, Sparkles } from "lucide-react";
import Link from "next/link";

type AuthPageProps = {
  creating: boolean;
  configured: boolean;
  error?: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function FloatingPaths({ position = 1, className = "" }: { position?: number; className?: string }) {
  const reducedMotion = useReducedMotion();
  const paths = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    d: `M-${380 - index * 5 * position} -${189 + index * 6}C-${380 - index * 5 * position} -${189 + index * 6} -${312 - index * 5 * position} ${216 - index * 6} ${152 - index * 5 * position} ${343 - index * 6}C${616 - index * 5 * position} ${470 - index * 6} ${684 - index * 5 * position} ${875 - index * 6} ${684 - index * 5 * position} ${875 - index * 6}`,
    width: 0.5 + index * 0.035,
  }));

  return <div className={`floating-paths ${className}`} aria-hidden="true">
    <svg viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
      {paths.map((path) => <motion.path key={path.id} d={path.d} stroke="currentColor" strokeWidth={path.width} strokeOpacity={0.08 + path.id * 0.018} initial={reducedMotion ? false : { pathLength: .18, opacity: .24 }} animate={reducedMotion ? { opacity: .32 } : { pathLength: [.18, 1, .42], pathOffset: [0, .82, 0], opacity: [.2, .58, .2] }} transition={{ duration: 16 + path.id * .22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />)}
    </svg>
  </div>;
}

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.4l-3.24-2.52c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.91A6 6 0 0 1 6.08 12c0-.66.11-1.31.31-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.51l3.35-2.6Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z"/></svg>;
}

export function AuthPage({ creating, configured, error, action }: AuthPageProps) {
  return <main className="auth-shell">
    <Link className="auth-home" href="/"><ArrowLeft size={17} aria-hidden="true" /> Voltar ao início</Link>
    <section className="auth-showcase" aria-label="Como o Orquestrador prepara o projeto">
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} className="floating-paths--reverse" />
      <div className="auth-showcase__brand"><span aria-hidden="true">OS</span><strong>Orquestrador</strong></div>
      <div className="auth-showcase__copy">
        <p>UM PROCESSO PARA CADA NOVA IDEIA</p>
        <h2>Entre com referências.<br/><span>Saia com direção.</span></h2>
        <div className="auth-showcase__flow" aria-label="Fluxo do produto"><span>Referências</span><ArrowRight aria-hidden="true"/><span>Skills</span><ArrowRight aria-hidden="true"/><strong>Plano revisado</strong></div>
      </div>
      <div className="auth-showcase__signal"><Sparkles size={16} aria-hidden="true"/><span>Seu repertório continua evoluindo com cada projeto.</span></div>
    </section>
    <section className="auth-access">
      <div className="auth-access__card">
        <div className="auth-access__icon" aria-hidden="true"><Layers3 /></div>
        <p className="auth-kicker">{creating ? "COMECE SUA BIBLIOTECA" : "CONTINUE SEU PROCESSO"}</p>
        <h1>{creating ? "Crie sua conta" : "Que bom ter você de volta"}</h1>
        <p className="auth-access__lead">{creating ? "Use sua conta Google para organizar skills, referências e critérios em um só lugar." : "Entre com a mesma conta Google para retomar suas seleções e projetos."}</p>
        <form action={action}>
          <button className="auth-google-button" type="submit" disabled={!configured}><GoogleMark/><span>{creating ? "Criar conta com Google" : "Entrar com Google"}</span><ArrowRight size={18} aria-hidden="true"/></button>
        </form>
        {!configured && <p className="auth-setup" role="alert">O acesso está sendo preparado. Conecte o Supabase para liberar o teste.</p>}
        {error && <p className="auth-error" role="alert">Não foi possível concluir o login. Confira os callbacks do Google e tente novamente.</p>}
        <div className="auth-switch"><span>{creating ? "Já tem uma conta?" : "Ainda não tem uma conta?"}</span><Link href={creating ? "/entrar" : "/entrar?intent=signup"}>{creating ? "Entrar" : "Criar conta"}</Link></div>
        <small>Ao continuar, você concorda com os <Link href="/termos">Termos de uso</Link> e a <Link href="/privacidade">Política de privacidade</Link>.</small>
      </div>
    </section>
  </main>;
}
