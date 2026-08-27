import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "data", "skills.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

if (!Array.isArray(catalog) || catalog.length === 0) throw new Error("data/skills.json precisa conter uma lista não vazia.");

const ids = new Set();
const names = new Set();
const sources = new Set();

for (const item of catalog) {
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(item.id)) throw new Error(`ID inválido: ${item.id}`);
  if (ids.has(item.id)) throw new Error(`ID duplicado: ${item.id}`);
  ids.add(item.id);

  const nameKey = String(item.name).trim().toLowerCase();
  if (!nameKey || names.has(nameKey)) throw new Error(`Nome ausente ou duplicado: ${item.name}`);
  names.add(nameKey);

  if (!String(item.description).trim() || !String(item.directive).trim()) throw new Error(`Descrição ou diretiva ausente em ${item.id}`);
  if (!['skill', 'personalization'].includes(item.kind)) throw new Error(`Tipo inválido em ${item.id}`);

  if (item.source) {
    const source = new URL(item.source);
    if (source.protocol !== "https:") throw new Error(`Fonte sem HTTPS em ${item.id}`);
    const sourceKey = source.toString().replace(/\/$/, "").toLowerCase();
    if (sources.has(sourceKey)) throw new Error(`Fonte duplicada em ${item.id}`);
    sources.add(sourceKey);
  }

  if (item.group === "Comunidade") {
    const skillFile = path.join(root, "skills", item.id, "SKILL.md");
    if (!fs.existsSync(skillFile)) throw new Error(`SKILL.md ausente para ${item.id}`);
    const markdown = fs.readFileSync(skillFile, "utf8");
    if (!markdown.startsWith("---\n") || !markdown.includes(`\nname: ${item.id}\n`) || !/\ndescription:\s*.+\n/.test(markdown)) {
      throw new Error(`Frontmatter inválido em skills/${item.id}/SKILL.md`);
    }
  }
}

console.log(`Catálogo validado: ${catalog.length} opções, sem IDs, nomes ou fontes duplicadas.`);
