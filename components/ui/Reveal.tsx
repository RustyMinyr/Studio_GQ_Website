"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
};

export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const shared = {
    className,
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: { duration: reduceMotion ? 0 : 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  } as const;

  return as === "section" ? (
    <motion.section {...shared}>{children}</motion.section>
  ) : (
    <motion.div {...shared}>{children}</motion.div>
  );
}

