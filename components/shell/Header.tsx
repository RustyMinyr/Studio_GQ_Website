"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNavigation } from "@/lib/site-content";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("/");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function closeMobileMenu() {
    setOpen(false);
    window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  }

  function getAriaCurrent(href: string) {
    if (pathname === "/") {
      if (activeHref !== href) return undefined;
      return href === "/" ? ("page" as const) : ("location" as const);
    }
    if (href === "/") return pathname === "/" ? ("page" as const) : undefined;
    return pathname === href || pathname.startsWith(`${href}/`)
      ? ("page" as const)
      : undefined;
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateActiveHref = () => {
      setActiveHref(window.location.hash ? `/${window.location.hash}` : "/");
      setOpen(false);
    };
    updateActiveHref();
    window.addEventListener("hashchange", updateActiveHref);
    return () => window.removeEventListener("hashchange", updateActiveHref);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const pageContent = document.getElementById("main-content");
    const footer = document.querySelector<HTMLElement>(".site-footer");
    let focusTimer: number | undefined;
    if (open) {
      pageContent?.setAttribute("inert", "");
      footer?.setAttribute("inert", "");
      focusTimer = window.setTimeout(() => {
        menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
      }, 50);
    } else {
      pageContent?.removeAttribute("inert");
      footer?.removeAttribute("inert");
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab") {
        const focusable = [
          menuButtonRef.current,
          ...Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []),
        ].filter(
          (element): element is HTMLButtonElement | HTMLAnchorElement =>
            element !== null,
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      pageContent?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // The crew portal has its own compact, authenticated navigation.
  if (pathname.startsWith("/crew")) return null;

  return (
    <>
      <header className={`site-header ${scrolled || pathname !== "/" ? "site-header--solid" : ""}`}>
        <div className="site-container site-header__inner">
          <Link
            href="/"
            className="site-header__logo"
            aria-label="Studio GQ home"
            onClick={() => setOpen(false)}
          >
            <Image
              unoptimized
              src="/logos/studio-gq-white.png"
              alt="Studio GQ"
              width={320}
              height={320}
              loading="eager"
            />
          </Link>
          <nav aria-label="Primary navigation" className="site-header__nav">
            {primaryNavigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={getAriaCurrent(item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <Link href="/booking" className="site-header__cta">
            Book the studio <span aria-hidden="true">{"\u2192"}</span>
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="site-header__menu-button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <div ref={menuRef} id="mobile-navigation" className={`mobile-menu ${open ? "mobile-menu--open" : ""}`} aria-hidden={!open} aria-label={open ? "Site navigation" : undefined} aria-modal={open ? "true" : undefined} role={open ? "dialog" : undefined}>
        <nav aria-label="Mobile navigation" className="site-container mobile-menu__nav">
          {primaryNavigation.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={getAriaCurrent(item.href)}
              tabIndex={open ? 0 : -1}
              onClick={closeMobileMenu}
            >
              <span>0{index + 1}</span>
              {item.label}
            </a>
          ))}
          <Link href="/booking" className="mobile-menu__book" tabIndex={open ? 0 : -1} onClick={closeMobileMenu}>
            Book the studio <span aria-hidden="true">{"\u2192"}</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
