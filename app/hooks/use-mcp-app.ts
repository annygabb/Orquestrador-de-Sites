"use client";

import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useSyncExternalStore } from "react";

let singletonApp: App | null = null;
const initialState = { connected: false, embedded: false, displayMode: "inline", canExpand: false };
let state = initialState;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function connect() {
  if (singletonApp || window.self === window.top) return;
  document.documentElement.dataset.embedded = "true";
  state = { ...state, embedded: true };
  notify();
  const { App } = await import("@modelcontextprotocol/ext-apps");
  const app = new App(
    { name: "orquestrador-de-sites", version: "1.0.0" },
    {},
    // Report content height only. Measuring the iframe's viewport can create a
    // height feedback loop, and reporting intrinsic width can shrink the host.
    { autoResize: false },
  );
  function updateContext(context?: McpUiHostContext) {
    state = {
      ...state,
      displayMode: context?.displayMode ?? state.displayMode,
      canExpand: context?.availableDisplayModes?.includes("fullscreen") ?? false,
    };
    document.documentElement.dataset.displayMode = state.displayMode;
    notify();
  }
  app.onhostcontextchanged = () => updateContext(app.getHostContext());
  app.onerror = (error) => console.error("[orquestrador]", error);
  try {
    await app.connect();
    singletonApp = app;
    state = { ...state, connected: true };
    updateContext(app.getHostContext());
    const content = document.querySelector("main");
    if (content) {
      let lastHeight = 0;
      let frame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const height = Math.ceil(content.getBoundingClientRect().height);
          if (height !== lastHeight && height > 0) {
            lastHeight = height;
            void app.sendSizeChanged({ height }).catch(() => {});
          }
        });
      });
      observer.observe(content);
      window.addEventListener("pagehide", () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      }, { once: true });
    }
  } catch (error) {
    console.warn("O app está fora de um host MCP.", error);
  }
}

if (typeof window !== "undefined") void connect();

export function useMcpApp() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initialState);
  async function toggleDisplayMode() {
    if (!singletonApp) return false;
    const mode = state.displayMode === "fullscreen" ? "inline" : "fullscreen";
    if (!singletonApp.getHostContext()?.availableDisplayModes?.includes(mode)) return false;
    const result = await singletonApp.requestDisplayMode({ mode });
    state = { ...state, displayMode: result.mode };
    document.documentElement.dataset.displayMode = result.mode;
    notify();
    return result.mode === mode;
  }
  return { app: singletonApp, ...snapshot, toggleDisplayMode };
}
