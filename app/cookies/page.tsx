import { LegalPage } from "@/app/components/legal-page";

export const metadata = { title: "Política de cookies" };

export default function CookiesPage() {
  return <LegalPage title="Política de cookies" summary="O que fica no navegador e o que é bloqueado até sua escolha."><h2>Cookies necessários</h2><p>Cookies de autenticação Supabase e proteção CSRF mantêm a sessão e bloqueiam requisições forjadas. Eles são HttpOnly, Secure em produção, SameSite e não ficam disponíveis ao JavaScript.</p><h2>Preferências locais</h2><p>O tema claro ou escuro e a escolha de cookies são armazenados no localStorage. Esses valores não contêm token, CPF, e-mail ou outro dado pessoal. O sistema não armazena autenticação no localStorage ou sessionStorage.</p><h2>Terceiros</h2><p>Cloudflare Turnstile é carregado somente quando o formulário de proposta é aberto. Scripts opcionais de análise e marketing devem permanecer bloqueados até consentimento e não fazem parte do MVP atual.</p><h2>Alterar a escolha</h2><p>A interface de preferências será ampliada antes de adicionar qualquer cookie opcional. Enquanto não houver cookies opcionais, escolher somente necessários mantém todas as funções essenciais.</p></LegalPage>;
}
