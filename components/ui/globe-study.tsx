"use client";

import { DotGlobeHero } from "@/components/ui/globe-hero";
import { cn } from "@/lib/utils";

type GlobeStudyProps = {
  className?: string;
  label?: string;
};

const orbitCopy = "SKILLS · REFERÊNCIAS · CRITÉRIOS · DIREÇÃO · ";

export default function GlobeStudy({ className, label = "Orquestrando seu próximo projeto" }: GlobeStudyProps) {
  return (
    <div className={cn("globe-study", className)} role="img" aria-label={label}>
      <DotGlobeHero rotationSpeed={0.0028} globeRadius={1.02} className="globe-study__canvas" />
      <div className="globe-study__latitude globe-study__latitude--one" aria-hidden="true"><span>{orbitCopy.repeat(2)}</span></div>
      <div className="globe-study__latitude globe-study__latitude--two" aria-hidden="true"><span>{orbitCopy.repeat(2)}</span></div>
      <div className="globe-study__axis" aria-hidden="true" />
      <span className="globe-study__core" aria-hidden="true">OS</span>
    </div>
  );
}
