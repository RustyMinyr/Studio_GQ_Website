import Image from "next/image";
import Link from "next/link";
import { contactDetails, navigation } from "@/lib/site-content";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer__grid">
        <div className="site-footer__brand">
          <Link href="/" aria-label="Studio GQ home">
            <Image unoptimized src="/logos/studio-gq-white.png" alt="Studio GQ" width={320} height={320} />
          </Link>
          <p>A purpose-built space for focused, ambitious creative work.</p>
        </div>
        <div>
          <p className="site-footer__label">Contact</p>
          <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>
          <a href={`tel:${contactDetails.phoneHref}`}>{contactDetails.phoneDisplay}</a>
          <p>Gqeberha, South Africa</p>
        </div>
        <div>
          <p className="site-footer__label">Links</p>
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </div>
        <div>
          <p className="site-footer__label">Follow</p>
          <a
            href="https://www.instagram.com/filmhouse_studiogq/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Instagram
          </a>
        </div>
        <div className="site-footer__newsletter">
          <p className="site-footer__label">Newsletter</p>
          <h2>Stay updated on new spaces and gear.</h2>
          <NewsletterForm />
        </div>
      </div>
      <div className="site-container site-footer__legal">
        <p>{"\u00A9"} 2026 Studio GQ. All rights reserved.</p>
        <div>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
