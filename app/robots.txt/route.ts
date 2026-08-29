export function GET() {
  const origin = process.env.APP_ORIGIN || "https://orquestradordesites.vercel.app";
  const body = ["User-agent: *", "Allow: /", "Disallow: /painel", "Disallow: /perfil", "Disallow: /pagamento", "Disallow: /api", "Disallow: /mcp", `Sitemap: ${origin.replace(/\/$/, "")}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
