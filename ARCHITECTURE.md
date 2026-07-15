# Studio GQ website architecture

This file is the source of truth for every contributor. The supplied brief, logos, and photography are fixed brand inputs; contributors may not redesign the brand, invent imagery, or change the homepage section order.

## Platform

- Next.js App Router with TypeScript and React Server Components by default.
- Tailwind CSS for layout and responsive composition, with design tokens and reset rules in `app/globals.css`.
- Framer Motion only inside small client components that need reveal or overlay interaction.
- Zod validation at the contact API boundary; no credentials or external form provider is required for this version.
- Standard Next.js source remains Vercel-ready. The existing vinext/Sites adapter is retained for the Codex preview and private production deployment.

## Route model

- `/`: fixed sequence of hero, services, about, gallery strip, booking CTA, footer.
- `/about`, `/spaces`, `/equipment`, `/gallery`, `/faq`, `/contact`: editorial internal pages using the same shell.
- `/api/contact`: validated JSON POST endpoint with honeypot and rate-limit-ready response headers.
- `sitemap.ts` and `robots.ts`: canonical discovery for `https://www.studiogq.co.za`.

## Component boundaries

- `components/ui/*`: shared primitives only (`ArrowLink`, `SectionLabel`, `Reveal`, `PageHero`, layout helpers).
- `components/shell/*`: site-wide `Header`, `MobileMenu`, and `Footer`.
- `components/home/*`: homepage sections. Never imported by internal page modules.
- `components/content/*`: internal-page interactive and editorial components only.
- `components/contact/*`: form UI and submission state only.
- `lib/*`: typed content, metadata helpers, image maps, and validation. No React components.

## Brand and design tokens

- Palette: `#050505`, `#0a0a0a`, `#151515`, `#fff`, `#f7f7f5`, `#e7e7e4`, `#a7a7a3`, `#565656` only.
- Typeface: Geist Sans throughout. Headings use weight 400, tight tracking, and editorial line height.
- Content width: 1400px maximum with responsive gutters from 20px to 48px.
- Corners: 0px by default; interactive controls may use at most 2px.
- Borders: 1px neutral lines. No shadows, gradients other than the hero image fade, or pill controls.
- Motion: 16-24px reveal distance, 400-800ms duration, once per section, and disabled under `prefers-reduced-motion`.
- Images: supplied Studio GQ photography only, natural colour and texture, descriptive alt text, `next/image`, explicit sizes, and intentional object positions.

## Accessibility contract

- One page-level `h1`, sequential headings, semantic landmarks, and a visible skip link.
- Keyboard-operable mobile menu, FAQ accordion, lightbox, and form.
- Escape closes overlays; focus remains visible and returns to the triggering control.
- Minimum 44px touch targets, explicit labels, status announcements, and no reliance on colour alone.
- Body copy and controls must meet WCAG AA contrast. Reduced motion is mandatory.

## Performance and SEO contract

- Only the hero image is eager/high priority; below-the-fold media is lazy and sized.
- Client components must be limited to genuine interaction or motion boundaries.
- Each route exports distinct metadata and a canonical URL.
- Root layout owns Open Graph/Twitter defaults and LocalBusiness JSON-LD.
- No analytics, map embed, remote fonts, or third-party scripts in the initial release.

## Asset map

- `hero-studio-gq.webp`: performance-optimized derivative of the supplied woman-in-black production photograph; homepage hero.
- `studio-infinity-curve-group.webp`: optimized derivative of the supplied full studio group photograph; about section.
- `gallery/portrait-man-standing.webp`: optimized supplied full-length male portrait.
- `gallery/studio-production-wide.webp`: optimized supplied full studio production view.
- `gallery/hair-makeup.webp` and `hair-makeup-detail.webp`: optimized supplied preparation photographs.
- `gallery/behind-the-scenes.webp`: optimized supplied photographed set in progress.
- `gallery/portrait-seated.webp` and `portrait-seated-wide.webp`: optimized supplied seated portrait variations.
- `logos/studio-gq-*-transparent.svg`: supplied masters, preserved unchanged. The site serves small transparent PNG derivatives made from those masters; the logo is never recreated as live text.

The supplied set does not include distinct greenscreen, podcast-room, or boardroom photographs. Pages may describe those spaces, but must not label unrelated photographs as those facilities.

## Parallel ownership

- Homepage UI agent: `app/page.tsx` and `components/home/*` only.
- Internal routes agent: `app/about`, `app/spaces`, `app/equipment`, `app/gallery`, `app/faq`, and `components/content/*` only.
- Backend/SEO/QA agent: `app/contact`, `app/api/contact`, `lib/contact-schema.ts`, `app/sitemap.ts`, `app/robots.ts`, and test files only.
- Lead agent: `app/layout.tsx`, `app/globals.css`, `components/ui/*`, `components/shell/*`, shared `lib/site-content.ts`, assets, dependencies, integration, documentation, build, browser QA, and deployment.

Agents must not edit files outside their ownership. If a missing shared primitive blocks work, they should use the documented import contract and report it for lead integration instead of creating a duplicate.
