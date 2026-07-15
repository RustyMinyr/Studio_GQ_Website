# Studio GQ website

Production-ready website for Studio GQ, a purpose-built film, photography, podcast and content production studio in Gqeberha, South Africa.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server.

## Validate a production build

```bash
npm run lint
npm run build
```

The App Router source is compatible with Vercel. The repository also retains the vinext/Sites adapter used for the included private deployment workflow.

## Contact form

The booking form posts to `/api/contact`, where input is parsed with Zod, the honeypot is checked, and safe JSON responses are returned. The initial release does not transmit enquiries to a third party. To connect Resend, Formspree, Supabase, or another service, add the delivery call after validation in the route handler and store credentials in deployment environment variables—never in source control. See `.env.example` for suggested names.

## Content and assets

The site uses only supplied Studio GQ photography and final stacked logo files. The authoritative mapping and component contracts are documented in `ARCHITECTURE.md`.

The supplied imagery does not include distinct greenscreen, podcast-room, or meeting-room photographs. Those spaces are described in copy without misrepresenting unrelated imagery.

## Main route

- `/` — single-page Studio GQ experience with hero, services, about, equipment, studio imagery, FAQ and booking sections
- Legacy marketing URLs redirect to their matching homepage section; gallery redirects to the homepage
- `/privacy` and `/terms` remain separate legal routes

## Deployment

For Vercel, import the repository and use the default framework settings. Add real delivery credentials only after selecting a form provider. Canonical metadata is configured for `https://www.studiogq.co.za`.
