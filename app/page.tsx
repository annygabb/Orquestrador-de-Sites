"use client";

import { catalog, type CatalogKind } from "@/lib/catalog";
import Script from "next/script";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { useMcpApp } from "./hooks/use-mcp-app";
import { useTurnstile } from "./hooks/use-turnstile";
import { AutoGrowTextarea } from "./components/auto-grow-textarea";

type Tab = "all" | CatalogKind;
type Stage = "select" | "destination" | "done";
type SkillDraft = { name: string; description: string; directive: string; source: string };
type DeliveryMode = "chat" | "clipboard";

const emptyDraft: SkillDraft = { name: "", description: "", directive: "", source: "" };
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Home() {
  const { app, connected } = useMcpApp();
  const [stage, setStage] = useState<Stage>("select");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [draft, setDraft] = useState<SkillDraft>(emptyDraft);
  const [proposalStatus, setProposalStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalUrl, setProposalUrl] = useState("");
  const [destinationLink, setDestinationLink] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("chat");
  const [preparedPrompt, setPreparedPrompt] = useState("");
  const proposalInFlight = useRef(false);
  const verification = useTurnstile(turnstileSiteKey, showSkillForm && stage === "select");

  const allItems = catalog;
  const selectedItems = useMemo(() => allItems.filter((item) => selected.has(item.id)), [allItems, selected]);

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return allItems.filter((item) => {
      const matchesTab = tab === "all" || item.kind === tab;
      const haystack = `${item.name} ${item.description} ${item.group}`.toLocaleLowerCase("pt-BR");
      return matchesTab && (!term || haystack.includes(term));
    });
  }, [allItems, query, tab]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setStatus("idle");
  }

  async function addCustomSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (proposalInFlight.current) return;
    const formElement = event.currentTarget;
    const name = draft.name.trim();
    const description = draft.description.trim();
    const directive = draft.directive.trim();
    const source = draft.source.trim();
    const formData = new FormData(formElement);
    const website = String(formData.get("website") ?? "");
    if (!name || !description || !directive || !source) return;
    if (!turnstileSiteKey) {
      setProposalStatus("error");
      setProposalMessage("O envio protegido ainda precisa ser configurado pela administradora.");
      return;
    }
    proposalInFlight.current = true;
    setProposalStatus("submitting");
    setProposalMessage("");
    setProposalUrl("");
    try {
      const turnstileToken = await verification.getFreshToken();
      const payload = { name, description, directive, source, turnstileToken, website };
      let data: { success?: boolean; message?: string; pullRequestUrl?: string };
      if (app) {
        const result = await app.callServerTool({ name: "submit_skill_proposal", arguments: payload });
        data = result.structuredContent as typeof data;
      } else {
        const response = await fetch("/api/skills/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await response.json() as typeof data;
        if (!response.ok) throw new Error(data.message || "Não foi possível enviar a proposta.");
      }
      if (!data?.success) throw new Error(data?.message || "Não foi possível enviar a proposta.");
      setProposalStatus("success");
      setProposalMessage("Skill enviada para aprovação");
      setProposalUrl(data.pullRequestUrl ?? "");
      setDraft(emptyDraft);
    } catch (error) {
      setProposalStatus("error");
      setProposalMessage(error instanceof Error ? error.message : "Não foi possível enviar a skill para aprovação.");
    } finally {
      // Siteverify consumes a token even when a later operation fails.
      // Never resend a token or automatically retry a potentially-created PR.
      verification.reset();
      proposalInFlight.current = false;
    }
  }

  function buildPrompt(link: string) {
    const directives = selectedItems.map((item, index) => `${index + 1}. ${item.name}\n${item.directive}${item.source ? `\nFonte: ${item.source}` : ""}`).join("\n\n");
    return `Aplique as skills e personalizações confirmadas abaixo ao projeto desta conversa.\n\nDestino informado pela usuária: ${link}\n\nSKILLS CONFIRMADAS\n${directives}\n\nAntes de alterar qualquer projeto, analise o contexto e preserve o escopo, os requisitos e as autorizações já definidos por Anny Gabrielly. Se o link apontar para uma conversa diferente, use-o somente como referência: faça as mudanças na conversa atual ou peça os arquivos/link público necessários.`;
  }

  async function deliver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!destinationLink.trim() || selectedItems.length === 0) return;
    setStatus("saving");
    const prompt = buildPrompt(destinationLink.trim());
    try {
      if (app) {
        const result = await app.callServerTool({
          name: "confirm_skill_selection",
          arguments: {
            selectedIds: [...selected],
            destinationLink: destinationLink.trim(),
          },
        });
        const data = result.structuredContent as { prompt?: string } | undefined;
        const message = data?.prompt ?? prompt;
        await app.sendMessage({ role: "user", content: [{ type: "text", text: message }] });
        setPreparedPrompt(message);
        setDeliveryMode("chat");
      } else {
        await navigator.clipboard.writeText(prompt);
        setPreparedPrompt(prompt);
        setDeliveryMode("clipboard");
      }
      setStatus("idle");
      setStage("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (!app) {
        window.setTimeout(() => {
          window.location.assign("https://chatgpt.com/");
        }, 900);
      }
    } catch (error) {
      console.error(error);
      setPreparedPrompt(prompt);
      setStatus("error");
    }
  }

  async function copyPreparedPrompt() {
    await navigator.clipboard.writeText(preparedPrompt || buildPrompt(destinationLink));
    setDeliveryMode("clipboard");
  }

  function resetFlow() {
    setStage("select");
    setDestinationLink("");
    setPreparedPrompt("");
    setStatus("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="panel-v2">
      <header className="panel-header">
        <a className="wordmark" href="#top" aria-label="Orquestrador de Sites — início"><span className="wordmark-mark">OS</span><span>Orquestrador de Sites</span></a>
        <span className={`host-status ${connected ? "is-connected" : ""}`}><span aria-hidden="true" />{connected ? "Dentro do ChatGPT" : "Modo navegador"}</span>
      </header>

      <div className="flow-line" aria-label="Etapas do envio">
        <button className={stage === "select" ? "is-current" : "is-complete"} onClick={() => setStage("select")}><span>1</span> Selecionar</button>
        <span className="flow-rule" />
        <button className={stage === "destination" ? "is-current" : stage === "done" ? "is-complete" : ""} disabled={selected.size === 0} onClick={() => selected.size > 0 && setStage("destination")}><span>2</span> Destino</button>
        <span className="flow-rule" />
        <button className={stage === "done" ? "is-current" : ""} disabled={stage !== "done"}><span>3</span> Enviar</button>
      </div>

      {stage === "select" && (
        <>
          <section className="panel-intro" id="top">
            <div><p>Monte seu conjunto de trabalho</p><h1>Escolha as skills que vão orientar o projeto.</h1></div>
            <p className="panel-lead">Marque uma ou várias opções. Assim que a primeira for selecionada, a confirmação será liberada.</p>
          </section>

          <section className="catalog-controls" aria-label="Filtros do catálogo">
            <div className="tabs" role="tablist" aria-label="Tipo de opção">
              {([['all', 'Tudo'], ['skill', 'Skills'], ['personalization', 'Personalização']] as const).map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}
            </div>
            <label className="search-field"><span className="sr-only">Pesquisar opções</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar skill ou categoria" /></label>
          </section>

          <div className="catalog-actions">
            <span><strong>{visible.length}</strong> opções encontradas</span>
            <div>
              <button className="button-secondary" disabled={proposalStatus === "submitting"} onClick={() => setShowSkillForm((current) => !current)} aria-expanded={showSkillForm}>{showSkillForm ? "Fechar formulário" : "Adicionar skill"}</button>
              <button className="button-quiet" onClick={() => setSelected(new Set(visible.map((item) => item.id)))}>Selecionar visíveis</button>
              <button className="button-quiet" onClick={() => setSelected(new Set())} disabled={selected.size === 0}>Limpar</button>
            </div>
          </div>

          {showSkillForm && (
            <section className="skill-builder" aria-labelledby="skill-builder-title">
              <div className="skill-builder-copy"><h2 id="skill-builder-title">Propor uma nova skill</h2><p>O sistema criará um Pull Request no GitHub. Ela só aparecerá para todos depois da revisão e aprovação de Anny.</p></div>
              <form onSubmit={addCustomSkill} className="skill-builder-form">
                <label><span>Nome *</span><AutoGrowTextarea required minLength={3} maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ex.: Revisão para clínicas" /></label>
                <label><span>Descrição curta *</span><AutoGrowTextarea required minLength={20} maxLength={240} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Quando essa skill deve ser usada?" /></label>
                <label className="wide"><span>Instruções</span><AutoGrowTextarea required minLength={40} maxLength={3000} rows={5} value={draft.directive} onChange={(event) => setDraft({ ...draft, directive: event.target.value })} placeholder="Descreva o objetivo, o fluxo e os limites reais da skill." /></label>
                <label className="wide"><span>Repositório da fonte *</span><input type="url" required maxLength={500} value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="https://github.com/autor/skill" /></label>
                <label className="proposal-honeypot" aria-hidden="true"><span>Não preencha</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
                <div className="wide proposal-verification">
                  {turnstileSiteKey ? <>
                    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={verification.onScriptReady} onError={verification.onScriptError} />
                    <div ref={verification.containerRef} hidden={verification.phase === "recheck"} />
                    <div className="verification-status" role="status" aria-live="polite">
                      <span>{verification.message}</span>
                      {(verification.phase === "recheck" || verification.phase === "error") && <button type="button" className="button-secondary" disabled={proposalStatus === "submitting"} onClick={() => verification.reset(verification.phase === "recheck")}>Verificar novamente</button>}
                    </div>
                  </> : <p>A proteção anti-spam precisa ser configurada antes de aceitar propostas.</p>}
                </div>
                {proposalStatus === "success" && <div className="proposal-feedback proposal-success wide" role="status"><strong>Skill enviada para aprovação</strong><span>Ela entrará no catálogo global somente após a revisão e o merge por Anny.</span>{proposalUrl && <a href={proposalUrl} target="_blank" rel="noopener noreferrer">Acompanhar Pull Request</a>}</div>}
                {proposalStatus === "error" && <div className="proposal-feedback proposal-error wide" role="alert"><strong>Proposta não enviada</strong><span>{proposalMessage}</span></div>}
                <div className="builder-actions wide"><button type="button" className="button-quiet" disabled={proposalStatus === "submitting"} onClick={() => { setShowSkillForm(false); setDraft(emptyDraft); setProposalStatus("idle"); }}>Cancelar</button><button type="submit" className="button-primary" disabled={proposalStatus === "submitting" || !turnstileSiteKey || verification.phase === "loading" || verification.phase === "recheck" || verification.phase === "error"}>{proposalStatus === "submitting" ? "Verificando e enviando…" : "Enviar para aprovação"}</button></div>
              </form>
            </section>
          )}

          <section className="skill-grid" aria-live="polite">
            {visible.map((item) => {
              const checked = selected.has(item.id);
              return (
                <article className={`skill-card ${checked ? "is-selected" : ""}`} key={item.id}>
                  <label>
                    <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} />
                    <span className="selection-box" aria-hidden="true">{checked ? "✓" : ""}</span>
                    <span className="skill-content"><span className="skill-meta"><span>{item.group}</span>{item.badge && <em>{item.badge}</em>}</span><strong>{item.name}</strong><span>{item.description}</span></span>
                  </label>
                  <div className="card-links">{item.source && <a href={item.source} target="_blank" rel="noopener noreferrer">Ver fonte</a>}</div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {stage === "destination" && (
        <section className="destination-screen">
          <div className="destination-main">
            <button className="back-button" onClick={() => setStage("select")}>← Voltar à seleção</button>
            <p className="stage-label">Etapa 2 de 3</p>
            <h1>Onde essas skills devem ser aplicadas?</h1>
            <p>Informe o link do chat em que o projeto foi criado ou o endereço público do site que será revisado.</p>
            <form className="destination-form" onSubmit={deliver}>
              <label><span>Link do chat ou projeto</span><input type="url" required autoFocus value={destinationLink} onChange={(event) => setDestinationLink(event.target.value)} placeholder="https://chatgpt.com/c/... ou https://seusite.com" /></label>
              <div className="destination-note"><strong>{connected ? "O painel está no ChatGPT." : "O painel está no navegador."}</strong><span>{connected ? "As instruções serão enviadas à conversa em que este painel foi aberto. O link informado entra como referência do projeto." : "O painel vai copiar um prompt pronto e redirecionar você ao ChatGPT. Lá, basta colar no chat desejado."}</span></div>
              {status === "error" && <div className="error-message" role="alert">O envio automático não foi concluído. O texto ficou preparado para você copiar.<button type="button" onClick={copyPreparedPrompt}>Copiar instruções</button></div>}
              <button className="button-primary destination-submit" disabled={!destinationLink.trim() || status === "saving"}>{status === "saving" ? "Preparando envio…" : connected ? "Enviar para este chat" : "Copiar e abrir o ChatGPT"}</button>
            </form>
          </div>
          <aside className="selection-review" aria-label="Resumo da seleção"><span>Seleção confirmada</span><strong>{selectedItems.length} {selectedItems.length === 1 ? "opção" : "opções"}</strong><ul>{selectedItems.map((item) => <li key={item.id}>{item.name}</li>)}</ul></aside>
        </section>
      )}

      {stage === "done" && (
        <section className="done-screen">
          <span className="done-mark" aria-hidden="true">✓</span><p className="stage-label">Etapa 3 de 3</p>
          <h1>{deliveryMode === "chat" ? "Skills enviadas ao chat atual." : "Abrindo o ChatGPT."}</h1>
          <p>{deliveryMode === "chat" ? "O ChatGPT recebeu a seleção, o link de referência e as instruções completas para trabalhar no projeto." : "As instruções já foram copiadas. Quando o ChatGPT abrir, cole o texto no chat do projeto."}</p>
          <div className="done-actions">{deliveryMode === "clipboard" && <a className="button-primary" href="https://chatgpt.com/">Abrir agora</a>}<button className="button-secondary" onClick={resetFlow}>Voltar ao painel</button></div>
        </section>
      )}

      <footer className="project-credit"><p>Idealização e requisitos de criação por <a href="https://github.com/annygabb" target="_blank" rel="noopener noreferrer">Anny Gabrielly · @annygabb</a></p><span>Todos os requisitos, decisões de produto e direcionamentos de criação deste projeto são de autoria de Anny Gabrielly.</span></footer>

      {stage === "select" && (
        <aside className={`selection-dock ${selected.size > 0 ? "has-selection" : ""}`} aria-live="polite">
          <div><strong>{selected.size}</strong><span>{selected.size === 1 ? "opção selecionada" : "opções selecionadas"}</span></div>
          <p>{selected.size === 0 ? "Selecione uma opção para continuar." : "Sua seleção está pronta para confirmar."}</p>
          <button className="button-primary" disabled={selected.size === 0} onClick={() => { setStage("destination"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Confirmar seleção</button>
        </aside>
      )}
    </main>
  );
}
