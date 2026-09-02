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
  assert.match(page, /www\.behance\.net\/embed\/project\/232976091/);
});

test("experiência combina celular 3D, GSAP, Framer Motion e Lenis", async () => {
  const [phone, motion] = await Promise.all([
    read("../app/components/phone-story.tsx"),
    read("../app/components/marketing-motion.tsx"),
  ]);

  assert.match(phone, /orquestrador-phone\.jpg/);
  assert.match(phone, /from "framer-motion"/);
  assert.match(phone, /ScrollTrigger/);
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

test("preloader é curto e a referência externa está liberada somente no frame-src", async () => {
  const [preloader, proxy] = await Promise.all([
    read("../app/components/page-preloader.tsx"),
    read("../proxy.ts"),
  ]);
  assert.match(preloader, /720/);
  assert.match(proxy, /frame-src[^\n]+https:\/\/www\.behance\.net/);
  assert.doesNotMatch(proxy, /script-src[^\n]+behance/);
});
