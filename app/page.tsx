"use client";

import { catalog, type CatalogItem, type CatalogKind } from "@/lib/catalog";
import { type FormEvent, useMemo, useState } from "react";
import { useMcpApp } from "./hooks/use-mcp-app";

type Tab = "all" | CatalogKind;
type Stage = "select" | "destination" | "done";
type SkillDraft = { name: string; description: string; directive: string; source: string };
type DeliveryMode = "chat" | "clipboard";

const emptyDraft: SkillDraft = { name: "", description: "", directive: "", source: "" };

export default function Home() {
  const { app, connected } = useMcpApp();
  const [stage, setStage] = useState<Stage>("select");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customSkills, setCustomSkills] = useState<CatalogItem[]>([]);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [draft, setDraft] = useState<SkillDraft>(emptyDraft);
  const [destinationLink, setDestinationLink] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("chat");
  const [preparedPrompt, setPreparedPrompt] = useState("");

  const allItems = useMemo(() => [...customSkills, ...catalog], [customSkills]);
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

  function addCustomSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.name.trim();
    const description = draft.description.trim();
    const directive = draft.directive.trim();
    if (!name || !description || !directive) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const skill: CatalogItem = { id, name, kind: "skill", group: "Personalizadas", description, directive, source: draft.source.trim() || undefined, badge: "Sua skill" };
    setCustomSkills((current) => [skill, ...current]);
    setSelected((current) => new Set(current).add(id));
    setDraft(emptyDraft);
    setShowSkillForm(false);
    setTab("skill");
    setQuery("");
  }

  function removeCustomSkill(id: string) {
    setCustomSkills((current) => current.filter((item) => item.id !== id));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
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
        const customSelected = customSkills.filter((item) => selected.has(item.id));
        const catalogIds = [...selected].filter((id) => !id.startsWith("custom-"));
        const result = await app.callServerTool({
          name: "confirm_skill_selection",
          arguments: {
            selectedIds: catalogIds,
            destinationLink: destinationLink.trim(),
            customSkills: customSelected.map(({ id, name, description, directive, source }) => ({ id, name, description, directive, source })),
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
              <button className="button-secondary" onClick={() => setShowSkillForm((current) => !current)} aria-expanded={showSkillForm}>{showSkillForm ? "Fechar formulário" : "Adicionar skill"}</button>
              <button className="button-quiet" onClick={() => setSelected(new Set(visible.map((item) => item.id)))}>Selecionar visíveis</button>
              <button className="button-quiet" onClick={() => setSelected(new Set())} disabled={selected.size === 0}>Limpar</button>
            </div>
          </div>

          {showSkillForm && (
            <section className="skill-builder" aria-labelledby="skill-builder-title">
              <div className="skill-builder-copy"><h2 id="skill-builder-title">Adicionar uma skill própria</h2><p>Ela entra na lista já selecionada e só será aplicada depois da confirmação.</p></div>
              <form onSubmit={addCustomSkill} className="skill-builder-form">
                <label><span>Nome *</span><input required maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ex.: Revisão para clínicas" /></label>
                <label><span>Descrição curta *</span><input required maxLength={180} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="O que ela resolve?" /></label>
                <label className="wide"><span>Instruções para o ChatGPT *</span><textarea required maxLength={2000} rows={5} value={draft.directive} onChange={(event) => setDraft({ ...draft, directive: event.target.value })} placeholder="Descreva como analisar ou modificar o projeto." /></label>
                <label className="wide"><span>Link da fonte <small>opcional</small></span><input type="url" value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="https://github.com/..." /></label>
                <div className="builder-actions wide"><button type="button" className="button-quiet" onClick={() => { setShowSkillForm(false); setDraft(emptyDraft); }}>Cancelar</button><button type="submit" className="button-primary">Adicionar e selecionar</button></div>
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
                  <div className="card-links">{item.source && <a href={item.source} target="_blank" rel="noopener noreferrer">Ver fonte</a>}{item.id.startsWith("custom-") && <button type="button" onClick={() => removeCustomSkill(item.id)}>Remover</button>}</div>
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
              <div className="destination-note"><strong>{connected ? "O painel está no ChatGPT." : "O painel está no navegador."}</strong><span>{connected ? "As instruções serão enviadas à conversa em que este painel foi aberto. O link informado entra como referência do projeto." : "O navegador não pode escrever em uma conversa do ChatGPT. O painel vai copiar um prompt pronto para você colar no chat desejado."}</span></div>
              {status === "error" && <div className="error-message" role="alert">O envio automático não foi concluído. O texto ficou preparado para você copiar.<button type="button" onClick={copyPreparedPrompt}>Copiar instruções</button></div>}
              <button className="button-primary destination-submit" disabled={!destinationLink.trim() || status === "saving"}>{status === "saving" ? "Preparando envio…" : connected ? "Enviar para este chat" : "Copiar para usar no ChatGPT"}</button>
            </form>
          </div>
          <aside className="selection-review" aria-label="Resumo da seleção"><span>Seleção confirmada</span><strong>{selectedItems.length} {selectedItems.length === 1 ? "opção" : "opções"}</strong><ul>{selectedItems.map((item) => <li key={item.id}>{item.name}</li>)}</ul></aside>
        </section>
      )}

      {stage === "done" && (
        <section className="done-screen">
          <span className="done-mark" aria-hidden="true">✓</span><p className="stage-label">Etapa 3 de 3</p>
          <h1>{deliveryMode === "chat" ? "Skills enviadas ao chat atual." : "Instruções copiadas."}</h1>
          <p>{deliveryMode === "chat" ? "O ChatGPT recebeu a seleção, o link de referência e as instruções completas para trabalhar no projeto." : "Abra o chat do projeto e cole o texto que já está na sua área de transferência."}</p>
          <div className="done-actions">{deliveryMode === "clipboard" && <a className="button-primary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Abrir ChatGPT</a>}<button className="button-secondary" onClick={resetFlow}>Voltar ao painel</button></div>
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
