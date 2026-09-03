"use client";

import { useState } from "react";

const options = [
  { id: "visual", name: "Frontend Design", note: "Hierarquia e direção visual" },
  { id: "seguranca", name: "Revisão de segurança", note: "Dados, acessos e riscos" },
  { id: "velocidade", name: "PageSpeed e SEO", note: "Desempenho e descoberta" },
  { id: "receita", name: "Revenue Centric Design", note: "Valor e conversão" },
];

export function MarketingSelectorDemo() {
  const [selected, setSelected] = useState(() => new Set(["visual", "seguranca"]));
  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  return <div className="product-console" aria-label="Demonstração interativa do seletor"><header><div><span className="console-status" aria-hidden="true" />Painel de seleção</div><strong>{selected.size} escolhidas</strong></header><div className="console-list">{options.map((option, index) => { const active = selected.has(option.id); return <button type="button" key={option.id} className={active ? "is-active" : ""} onClick={() => toggle(option.id)} aria-pressed={active}><span>{String(index + 1).padStart(2, "0")}</span><span><strong>{option.name}</strong><small>{option.note}</small></span><span className="console-check" aria-hidden="true">{active ? "✓" : "+"}</span></button>; })}</div><footer><span>Próxima ação</span><strong>{selected.size ? "Confirmar seleção" : "Escolha uma orientação"}</strong></footer></div>;
}
