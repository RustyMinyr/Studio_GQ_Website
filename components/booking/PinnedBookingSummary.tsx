"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const desktopQuery = "(min-width: 1024px)";
const headerOffset = 104;

type PinnedBookingSummaryProps = {
  children: ReactNode;
};

type PinnedStyle = Pick<CSSProperties, "left" | "position" | "top" | "width" | "zIndex">;

export function PinnedBookingSummary({ children }: PinnedBookingSummaryProps) {
  const anchorRef = useRef<HTMLElement>(null);
  const [pinnedStyle, setPinnedStyle] = useState<PinnedStyle>();

  useEffect(() => {
    let frame = 0;

    const updatePosition = () => {
      frame = 0;
      const anchor = anchorRef.current;
      if (!anchor || !window.matchMedia(desktopQuery).matches) {
        setPinnedStyle(undefined);
        return;
      }

      const bounds = anchor.getBoundingClientRect();
      if (bounds.top > headerOffset) {
        setPinnedStyle(undefined);
        return;
      }

      const nextStyle: PinnedStyle = {
        left: bounds.left,
        position: "fixed",
        top: headerOffset,
        width: bounds.width,
        zIndex: 20,
      };

      setPinnedStyle((current) =>
        current?.left === nextStyle.left && current?.width === nextStyle.width
          ? current
          : nextStyle,
      );
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updatePosition);
    };

    updatePosition();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <aside className="relative self-stretch" ref={anchorRef}>
      <div className="bg-[#0a0a0a]" style={pinnedStyle}>
        {children}
      </div>
    </aside>
  );
}
