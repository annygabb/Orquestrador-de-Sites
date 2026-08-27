"use client";

import { catalog, type CatalogKind } from "@/lib/catalog";
import { useMemo, useState } from "react";
import { useMcpApp } from "./hooks/use-mcp-app";

type Tab = "all" | CatalogKind;

export default function Home() {
  const { app, connected } = useMcpApp();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return catalog.filter((item) => {
      const matchesTab = tab === "all" || item.kind === tab;
      const haystack = `${item.name} ${item.description} ${item.group}`.toLocaleLowerCase("pt-BR");
      return matchesTab && (!term || haystack.includes(term));
    });
  }, [query, tab]);

  function toggle(id: string) {
    setStatus("idle");
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function confirm() {
    if (!app || selected.size === 0) return;
    setStatus("saving");
    try {
      const ids = [...selected];
      const result = await app.callServerTool({
        name: "confirm_skill_selection",
        arguments: { selectedIds: ids },
      });
      const summary = result.structuredContent as { message?: string } | undefined;
      setStatus("saved");
      await app.sendMessage({
        role: "user",
        content: [{ type: "text", text: summary?.message ?? `Seleção confirmada: ${ids.join(", ")}. Use estas opções a partir de agora.` }],
      });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ORQUESTRADOR DE SITES</p>
          <h1>Escolha como o projeto deve ser trabalhado.</h1>
          <p className="intro">Combine quantas skills e referências quiser. Nada é ativado antes da sua confirmação.</p>
        </div>
        <span className={`connection ${connected ? "online" : ""}`}>{connected ? "Conectado" : "Prévia"}</span>
      </header>

      <section className="toolbar" aria-label="Filtros do catálogo">
        <div className="tabs" role="tablist">
          {([['all', 'Tudo'], ['skill', 'Skills'], ['personalization', 'Personalização']] as const).map(([value, label]) => (
            <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar opções" aria-label="Pesquisar opções" />
      </section>

      <div className="summary-row">
        <span>{visible.length} opções exibidas</span>
        <div>
          <button className="text-button" onClick={() => setSelected(new Set(visible.map((item) => item.id)))}>Selecionar visíveis</button>
          <button className="text-button" onClick={() => setSelected(new Set())}>Limpar</button>
        </div>
      </div>

      <section className="grid" aria-live="polite">
        {visible.map((item) => {
          const checked = selected.has(item.id);
          return (
            <label className={`card ${checked ? "checked" : ""}`} key={item.id}>
              <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} />
              <span className="checkmark" aria-hidden="true">{checked ? "✓" : ""}</span>
              <span className="card-copy">
                <span className="meta"><span>{item.group}</span>{item.badge && <em>{item.badge}</em>}</span>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
                {item.source && <a href={item.source} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Ver fonte ↗</a>}
              </span>
            </label>
          );
        })}
      </section>

      <footer className="confirm-bar">
        <div><strong>{selected.size}</strong><span>{selected.size === 1 ? " opção selecionada" : " opções selecionadas"}</span></div>
        <div className="feedback" role="status">
          {status === "saved" && "Confirmado — enviado ao chat."}
          {status === "error" && "Não foi possível confirmar. Tente novamente."}
        </div>
        <button className="confirm" disabled={!connected || selected.size === 0 || status === "saving"} onClick={confirm}>
          {status === "saving" ? "Confirmando…" : "Confirmar seleção"}
        </button>
      </footer>
    </main>
  );
}
