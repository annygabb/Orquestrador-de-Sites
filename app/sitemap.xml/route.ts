function escapeXml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

export function GET() {
  const origin = (process.env.APP_ORIGIN || "https://orquestradordesites.vercel.app").replace(/\/$/, "");
  const today = new Date().toISOString();
  const urls = [{ loc: origin, changefreq: "weekly", priority: "1.0" }, { loc: `${origin}/entrar`, changefreq: "monthly", priority: "0.4" }];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((item) => `<url><loc>${escapeXml(item.loc)}</loc><lastmod>${today}</lastmod><changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`).join("\n")}\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
