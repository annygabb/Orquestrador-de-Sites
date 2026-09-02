"use client";

import { useEffect } from "react";

export function MarketingMotion() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    let disposed = false;
    let destroy: (() => void) | undefined;

    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("lenis"),
    ]).then(([gsapModule, triggerModule, lenisModule]) => {
      if (disposed) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      const Lenis = lenisModule.default;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 0.9, smoothWheel: true, syncTouch: false });
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTimeline.fromTo("[data-hero-reveal]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.72, stagger: 0.08, clearProps: "transform,opacity" });

      const section = document.querySelector("[data-motion-section]");
      if (section) {
        gsap.fromTo(section.children, { opacity: 0, y: 22 }, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: section, start: "top 82%", once: true },
        });
      }

      destroy = () => {
        heroTimeline.kill();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    });

    return () => {
      disposed = true;
      destroy?.();
    };
  }, []);

  return null;
}
