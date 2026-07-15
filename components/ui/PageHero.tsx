import type { ReactNode } from "react";
import { SectionLabel } from "./SectionLabel";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  children?: ReactNode;
  tone?: "dark" | "light";
};

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  tone = "dark",
}: PageHeroProps) {
  const isDark = tone === "dark";
  return (
    <section className={`page-hero ${isDark ? "page-hero--dark" : "page-hero--light"}`}>
      <div className="site-container page-hero__inner">
        <SectionLabel tone={isDark ? "dark" : "light"}>{eyebrow}</SectionLabel>
        <h1>{title}</h1>
        <p className="page-hero__intro">{intro}</p>
        {children ? <div className="page-hero__actions">{children}</div> : null}
      </div>
    </section>
  );
}
