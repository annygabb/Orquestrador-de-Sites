import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("hero comunica a transformação principal e oferece dois caminhos claros", async () => {
  const page = await read("../app/page.tsx");
  assert.match(page, /Suas referências viram um plano que a IA consegue executar\./);
  assert.match(page, /Organizar meu próximo site/);
  assert.match(page, /Ver o seletor funcionando/);
});

test("experiência combina 3D, GSAP, Framer Motion e Lenis sem CDN visual", async () => {
  const [scene, orbit, motion] = await Promise.all([
    read("../app/components/orchestration-scene.tsx"),
    read("../app/components/orchestration-orbit.tsx"),
    read("../app/components/marketing-motion.tsx"),
  ]);

  assert.match(scene, /<Canvas/);
  assert.match(scene, /torusKnotGeometry/);
  assert.doesNotMatch(scene, /Environment\s+preset=/);
  assert.match(orbit, /from "framer-motion"/);
  assert.match(motion, /import\("gsap"\)/);
  assert.match(motion, /import\("lenis"\)/);
});

test("movimento e layout respeitam acessibilidade e telas pequenas", async () => {
  const [orbit, motion, styles] = await Promise.all([
    read("../app/components/orchestration-orbit.tsx"),
    read("../app/components/marketing-motion.tsx"),
    read("../app/marketing.css"),
  ]);

  assert.match(orbit, /useReducedMotion/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(min-width: 40rem\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
