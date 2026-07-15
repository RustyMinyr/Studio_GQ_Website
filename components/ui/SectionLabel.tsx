import type { ReactNode } from "react";

type SectionLabelProps = {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
};

export function SectionLabel({
  children,
  className = "",
  tone = "light",
}: SectionLabelProps) {
  return (
    <p
      className={`section-label ${tone === "dark" ? "section-label--dark" : ""} ${className}`.trim()}
    >
      {children}
    </p>
  );
}

