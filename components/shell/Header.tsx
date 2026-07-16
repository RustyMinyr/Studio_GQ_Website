"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/lib/site-content";

const headerNavigation = navigation.filter((item) => item.href !== "/booking");

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("/");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function getAriaCurrent(href: string) {
    if (pathname === "/") {
      if (activeHref !== href) return undefined;
      return href === "/" ? ("page" as const) : ("location" as const);
    }
    return pathname === href ? ("page" as const) : undefined;
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
    if (open) {
      pageContent?.setAttribute("inert", "");
      footer?.setAttribute("inert", "");
      menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
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
        const focusable = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
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
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
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
          />
        </Link>
        <nav aria-label="Primary navigation" className="site-header__nav">
          {headerNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={getAriaCurrent(item.href)}
            >
              {item.label}
            </Link>
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
      <div ref={menuRef} id="mobile-navigation" className={`mobile-menu ${open ? "mobile-menu--open" : ""}`} aria-hidden={!open} aria-label={open ? "Site navigation" : undefined} aria-modal={open ? "true" : undefined} role={open ? "dialog" : undefined}>
        <nav aria-label="Mobile navigation" className="site-container mobile-menu__nav">
          {headerNavigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={getAriaCurrent(item.href)}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link href="/booking" className="mobile-menu__book" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            Book the studio <span aria-hidden="true">{"\u2192"}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
