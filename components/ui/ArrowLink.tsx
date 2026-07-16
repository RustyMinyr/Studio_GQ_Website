import Link from "next/link";
import type { ReactNode } from "react";

type ArrowLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "light" | "dark" | "outline-light" | "outline-dark";
  className?: string;
  target?: "_blank" | "_self";
  rel?: string;
};

export function ArrowLink({
  href,
  children,
  variant = "dark",
  className = "",
  target,
  rel,
}: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={`arrow-link arrow-link--${variant} ${className}`.trim()}
      target={target}
      rel={rel}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="arrow-link__arrow">
        {"\u2192"}
      </span>
    </Link>
  );
}
