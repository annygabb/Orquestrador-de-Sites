"use client";

import type { App } from "@modelcontextprotocol/ext-apps";
import { useSyncExternalStore } from "react";

let singletonApp: App | null = null;
let connected = false;
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
  const { App } = await import("@modelcontextprotocol/ext-apps");
  const app = new App(
    { name: "orquestrador-de-sites", version: "1.0.0" },
    {},
    { autoResize: true },
  );
  app.onerror = (error) => console.error("[orquestrador]", error);
  try {
    await app.connect();
    singletonApp = app;
    connected = true;
    notify();
  } catch (error) {
    console.warn("O app está fora de um host MCP.", error);
  }
}

if (typeof window !== "undefined") void connect();

export function useMcpApp() {
  const isConnected = useSyncExternalStore(subscribe, () => connected, () => false);
  return { app: singletonApp, connected: isConnected };
}
