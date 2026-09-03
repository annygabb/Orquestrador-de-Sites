export async function csrfHeaders() {
  const response = await fetch("/api/security/csrf", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível validar a sessão.");
  const data = await response.json() as { token: string };
  return { "x-csrf-token": data.token };
}
