import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("hero comunica a transformação principal e oferece dois caminhos claros", async () => {
  const page = await read("../app/page.tsx");
  assert.match(page, /Menos procura\./);
  assert.match(page, /Mais direção/);
  assert.match(page, /Organizar meu próximo site/);
  assert.match(page, /Ver a transformação/);
  assert.doesNotMatch(page, /behance/i);
  assert.match(page, /demand-group[^]*aria-hidden="true"/);
  assert.match(page, /<ShaderHero/);
  assert.doesNotMatch(page, /<PhoneStory compact/);
});

test("experiência combina celular 3D, GSAP, Framer Motion e Lenis", async () => {
  const [phone, motion] = await Promise.all([
    read("../app/components/phone-story.tsx"),
    read("../app/components/marketing-motion.tsx"),
  ]);

  assert.match(phone, /orquestrador-phone\.webp/);
  assert.match(phone, /from "framer-motion"/);
  assert.match(phone, /ScrollTrigger/);
  assert.match(phone, /dragSnapToOrigin/);
  assert.match(phone, /aria-current/);
  assert.doesNotMatch(phone, /skill-chip/);
  assert.doesNotMatch(phone, /\/04/);
  assert.match(motion, /import\("gsap"\)/);
  assert.match(motion, /import\("lenis"\)/);
});

test("movimento e layout respeitam acessibilidade e telas pequenas", async () => {
  const [phone, motion, styles] = await Promise.all([
    read("../app/components/phone-story.tsx"),
    read("../app/components/marketing-motion.tsx"),
    read("../app/marketing.css"),
  ]);

  assert.match(phone, /useReducedMotion/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(min-width: 40rem\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("preloader 3D é curto e a política de frames não inclui a referência removida", async () => {
  const [preloader, proxy] = await Promise.all([
    read("../app/components/page-preloader.tsx"),
    read("../proxy.ts"),
  ]);
  assert.match(preloader, /820/);
  assert.match(preloader, /DotGlobeHero/);
  assert.doesNotMatch(proxy, /behance/i);
});

test("faixa de capacidades repete continuamente sem depender da rolagem", async () => {
  const [page, motion, styles] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/components/marketing-motion.tsx"),
    read("../app/marketing.css"),
  ]);
  assert.match(page, /className="demand-group" aria-hidden="true"/);
  assert.match(styles, /animation: demand-marquee 24s linear infinite/);
  assert.doesNotMatch(motion, /demand-strip/);
});

test("celular usa recorte transparente, texturas por etapa e Open Graph próprio", async () => {
  const [phone, styles, layout, og] = await Promise.all([
    read("../app/components/phone-story.tsx"),
    read("../app/marketing.css"),
    read("../app/layout.tsx"),
    read("../app/opengraph-image.tsx"),
  ]);
  assert.match(phone, /orquestrador-phone\.webp/);
  assert.match(phone, /--pointer-x/);
  assert.match(styles, /data-phone-stage="3"/);
  assert.match(styles, /phone-texture/);
  assert.match(layout, /summary_large_image/);
  assert.match(og, /Menos procura/);
});

test("login focado força uma coluna e evita a sobreposição no desktop", async () => {
  const [styles, login] = await Promise.all([
    read("../app/marketing.css"),
    read("../app/entrar/page.tsx"),
  ]);
  assert.match(styles, /\.auth-card\.auth-card--focused[^}]+grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /\.auth-card--focused > \*[^}]+grid-column: 1 \/ -1/);
  assert.match(login, /MovingBorderButton/);
  assert.doesNotMatch(login, /Sessão protegida por cookie seguro/);
});

test("estrutura shadcn, Tailwind e componentes de movimento estão integrados", async () => {
  const [globals, components, shader, border] = await Promise.all([
    read("../app/globals.css"),
    read("../components.json"),
    read("../components/ui/shader-hero.tsx"),
    read("../components/ui/moving-border.tsx"),
  ]);
  assert.match(globals, /tailwindcss\/utilities\.css/);
  assert.match(components, /@\/components\/ui/);
  assert.match(shader, /MeshGradient/);
  assert.match(shader, /aria-pressed/);
  assert.match(border, /useAnimationFrame/);
  assert.match(border, /useReducedMotion/);
});
