"use client";

import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

type MovingBorderButtonProps = {
  borderRadius?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
};

export function MovingBorderButton({
  borderRadius = "1rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration = 2600,
  className,
  ...otherProps
}: MovingBorderButtonProps) {
  const Root: any = Component;
  return (
    <Root
      className={cn("moving-border relative inline-flex min-h-14 overflow-hidden bg-transparent p-px", containerClassName)}
      style={{ borderRadius }}
      {...otherProps}
    >
      <span className="absolute inset-0" aria-hidden="true" style={{ borderRadius: `calc(${borderRadius} * .96)` }}>
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <span className={cn("block size-24 bg-[radial-gradient(circle,var(--color-stage-bright)_0%,var(--color-stage-accent)_38%,transparent_68%)] opacity-90", borderClassName)} />
        </MovingBorder>
      </span>
      <span
        className={cn("relative z-10 flex size-full min-h-[inherit] items-center justify-center gap-2 border border-[var(--color-stage-rule)] bg-[var(--color-stage-glass)] px-6 text-sm font-bold text-[var(--color-stage-white)] backdrop-blur-xl", className)}
        style={{ borderRadius: `calc(${borderRadius} * .96)` }}
      >
        {children}
      </span>
    </Root>
  );
}

export function MovingBorder({
  children,
  duration = 2600,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: unknown;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);
  const reducedMotion = useReducedMotion();

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length && !reducedMotion) progress.set((time * (length / duration)) % length);
  });

  const x = useTransform(progress, (value) => pathRef.current?.getPointAtLength(value).x ?? 0);
  const y = useTransform(progress, (value) => pathRef.current?.getPointAtLength(value).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg className="absolute size-full" width="100%" height="100%" preserveAspectRatio="none" {...otherProps}>
        <rect ref={pathRef} fill="none" width="100%" height="100%" rx={rx} ry={ry} />
      </svg>
      <motion.span className="absolute left-0 top-0 inline-block" style={{ transform }}>
        {children}
      </motion.span>
    </>
  );
}
