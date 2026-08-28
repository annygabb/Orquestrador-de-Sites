"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TurnstileClock } from "@/lib/turnstile-clock";

type Phase = "loading" | "verifying" | "ready" | "consumed" | "recheck" | "error";
type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

export function useTurnstile(siteKey: string | undefined, enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const clockRef = useRef<TurnstileClock | null>(null);
  const phaseRef = useRef<Phase>("loading");
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("Carregando a verificação…");

  const update = useCallback((next: Phase, text: string) => {
    phaseRef.current = next;
    setPhase(next);
    setMessage(text);
  }, []);

  const rejectPending = useCallback((text: string) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(text));
    }
  }, []);

  const requireRecheck = useCallback(() => {
    clockRef.current?.clear();
    update("recheck", "Você está há 25 minutos no painel. Clique em Verificar novamente para continuar. Seu formulário foi preservado.");
    rejectPending("Conclua a nova verificação antes de enviar. Seus dados foram preservados.");
  }, [rejectPending, update]);

  const reset = useCallback((restartWindow = false) => {
    const clock = clockRef.current;
    if (!clock) return;
    if (restartWindow) clock.restartWindow();
    if (clock.needsRecheck()) { requireRecheck(); return; }
    clock.clear();
    if (widgetRef.current !== null && window.turnstile) {
      update("verifying", "Atualizando a verificação… Seu formulário continua preenchido.");
      window.turnstile.reset(widgetRef.current);
    }
  }, [requireRecheck, update]);

  useEffect(() => { clockRef.current ??= new TurnstileClock(); }, []);

  useEffect(() => {
    if (!enabled || !siteKey || !scriptReady || !containerRef.current || !window.turnstile) return;
    const clock = clockRef.current!;
    let mounted = true;
    update("verifying", "Verificando… Se solicitado, conclua o desafio abaixo.");
    try {
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey.trim(), action: "skill_proposal", theme: "light", language: "pt-BR",
        size: containerRef.current.clientWidth < 300 ? "compact" : "flexible",
        "response-field": false, "refresh-expired": "auto", "refresh-timeout": "auto",
        callback: (token: string) => {
          if (!mounted) return;
          if (clock.needsRecheck()) { requireRecheck(); return; }
          clock.issue(token);
          const pending = pendingRef.current;
          if (pending) {
            pendingRef.current = null;
            clearTimeout(pending.timer);
            const fresh = clock.take();
            if (!fresh) { pending.reject(new Error("A verificação precisa ser renovada.")); return; }
            update("consumed", "Verificação recebida. Validando o envio no servidor…");
            pending.resolve(fresh);
          } else update("ready", "Verificação pronta. O servidor confirmará a validade ao enviar.");
        },
        "expired-callback": () => {
          if (!mounted) return;
          clock.clear();
          if (clock.needsRecheck()) requireRecheck();
          else update("verifying", "Renovando a verificação automaticamente…");
        },
        "timeout-callback": () => {
          if (!mounted) return;
          clock.clear();
          update("verifying", "O desafio demorou para ser concluído. Renovando a verificação…");
        },
        "error-callback": () => {
          if (!mounted) return true;
          clock.clear();
          update("error", "Não foi possível verificar. Confira sua conexão ou bloqueador de conteúdo e tente novamente.");
          rejectPending("Não foi possível concluir a verificação. Seus dados foram preservados.");
          return true;
        },
      });
    } catch {
      update("error", "Não foi possível carregar a verificação. Feche e reabra o formulário para tentar novamente.");
    }
    const check = () => {
      if (clock.needsRecheck()) requireRecheck();
      else if (phaseRef.current === "ready" && !clock.isFresh()) reset();
    };
    check();
    const timer = setInterval(check, 1000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      if (widgetRef.current !== null) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = null;
      clock.clear();
      rejectPending("O formulário foi fechado. Nenhuma nova proposta foi enviada.");
    };
  }, [enabled, siteKey, scriptReady, rejectPending, requireRecheck, reset, update]);

  const getFreshToken = useCallback(async () => {
    const clock = clockRef.current;
    if (!clock || widgetRef.current === null || !window.turnstile) throw new Error("Aguarde o carregamento da verificação.");
    if (clock.needsRecheck()) { requireRecheck(); throw new Error("Clique em Verificar novamente para continuar. Seus dados foram preservados."); }
    const token = clock.take();
    if (token) { update("consumed", "Verificação recebida. Validando o envio no servidor…"); return token; }
    if (pendingRef.current) throw new Error("Uma verificação já está em andamento.");
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        rejectPending("A verificação não foi concluída a tempo. Tente novamente; seus dados foram preservados.");
        update("error", "Conclua uma nova verificação para enviar.");
      }, 90_000);
      pendingRef.current = { resolve, reject, timer };
      reset();
    });
  }, [rejectPending, requireRecheck, reset, update]);

  return {
    containerRef, phase, message, getFreshToken, reset,
    onScriptReady: () => setScriptReady(true),
    onScriptError: () => update("error", "Não foi possível carregar a Cloudflare. Confira sua conexão e bloqueadores de conteúdo."),
  };
}
