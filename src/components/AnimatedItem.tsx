"use client";

import * as React from "react";

type ExitPhase = "idle" | "flash" | "exit" | "collapse" | "done";

const EXIT_TIMING = {flash: 120, exit: {list: 400, grid: 500}, collapse: 300} as const;

const EXIT_STYLES: Record<"list" | "grid", Record<"flash" | "exit", React.CSSProperties>> = {
  list: {
    flash: {
      background: "linear-gradient(90deg, rgba(239,68,68,.08), rgba(239,68,68,.02))",
      boxShadow: "inset 4px 0 0 0 rgba(239,68,68,.6)",
      transition: "all 120ms ease-out",
    },
    exit: {
      transform: "translateX(80px) scale(.96) rotate(1.5deg)",
      opacity: 0,
      filter: "blur(6px)",
      transition:
        "transform 400ms cubic-bezier(.36,0,.66,-.2), opacity 300ms ease-out, filter 400ms ease-out",
    },
  },
  grid: {
    flash: {
      boxShadow: "0 0 0 2px rgba(239,68,68,.5), 0 0 24px rgba(239,68,68,.15)",
      transition: "all 120ms ease-out",
      borderRadius: "inherit",
    },
    exit: {
      transform: "perspective(600px) rotateX(25deg) scale(.4)",
      opacity: 0,
      filter: "blur(10px)",
      transformOrigin: "center bottom",
      transition:
        "transform 500ms cubic-bezier(.36,0,.66,-.2), opacity 400ms ease-out, filter 500ms ease-out",
    },
  },
};

const COLLAPSE_STYLE: React.CSSProperties = {
  overflow: "hidden",
  transition: "height 300ms cubic-bezier(.22,1,.36,1)",
};

export function AnimatedItem({
  id,
  isRemoving,
  onRemoved,
  variant,
  children,
}: {
  id: string;
  isRemoving: boolean;
  onRemoved: (id: string) => void;
  variant: "list" | "grid";
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const cbRef = React.useRef(onRemoved);
  const [phase, setPhase] = React.useState<ExitPhase>("idle");

  React.useEffect(() => {
    cbRef.current = onRemoved;
  });

  // Kick off animation when removal starts
  React.useEffect(() => {
    if (isRemoving && phase === "idle") setPhase("flash");
  }, [isRemoving, phase]);

  // Phase state-machine: flash → exit → collapse (list) | done (grid)
  React.useEffect(() => {
    let ms: number;
    let next: ExitPhase;

    switch (phase) {
      case "flash":
        ms = EXIT_TIMING.flash;
        next = "exit";
        break;
      case "exit":
        ms = variant === "list" ? EXIT_TIMING.exit.list : EXIT_TIMING.exit.grid;
        next = variant === "list" ? "collapse" : "done";
        break;
      case "collapse": {
        const el = ref.current;
        if (el) {
          el.style.height = `${el.offsetHeight}px`;
          void el.offsetHeight;
          requestAnimationFrame(() => (el.style.height = "0px"));
        }
        ms = EXIT_TIMING.collapse;
        next = "done";
        break;
      }
      default:
        return;
    }

    const t = setTimeout(() => {
      setPhase(next);
      if (next === "done") cbRef.current(id);
    }, ms);

    return () => clearTimeout(t);
  }, [phase, id, variant]);

  if (phase === "done") return null;

  const styles = variant === "list" ? EXIT_STYLES.list : EXIT_STYLES.grid;
  const isExiting = phase === "exit" || phase === "collapse";
  const contentStyle = phase === "flash" ? styles.flash : isExiting ? styles.exit : undefined;

  return (
    <div ref={ref} style={phase === "collapse" ? COLLAPSE_STYLE : undefined}>
      <div style={contentStyle}>{children}</div>
    </div>
  );
}
