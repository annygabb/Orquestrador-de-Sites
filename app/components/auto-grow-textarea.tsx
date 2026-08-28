"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string };

/** Keep the entire draft visible, including after pasting, resizing or reopening. */
export function AutoGrowTextarea({ value, rows = 1, className = "", ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    const resize = () => {
      // Reset first so deleting text also shrinks back to the requested rows.
      field.style.height = "auto";
      const style = getComputedStyle(field);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      field.style.height = `${Math.ceil(field.scrollHeight + border)}px`;
    };
    resize();

    let width = field.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const nextWidth = field.getBoundingClientRect().width;
      // Height changes are ours; only width changes require another measurement.
      if (nextWidth !== width) {
        width = nextWidth;
        resize();
      }
    });
    observer.observe(field);
    document.fonts.addEventListener("loadingdone", resize);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", resize);
    };
  }, [value, rows]);

  return <textarea {...props} ref={ref} value={value} rows={rows} className={`auto-grow-textarea ${className}`} />;
}
