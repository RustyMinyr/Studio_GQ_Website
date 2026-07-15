import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const gradient = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#050505" stop-opacity="1"/>
        <stop offset="0.45" stop-color="#050505" stop-opacity="0.94"/>
        <stop offset="0.72" stop-color="#050505" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#050505" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#fade)"/>
  </svg>
`);

const logo = await sharp("public/logos/studio-gq-white-transparent.svg")
  .resize(150, 150, { fit: "contain" })
  .png()
  .toBuffer();

await sharp("assets/source-images/hero-studio-gq.jpg")
  .resize(1200, 630, { fit: "cover", position: "center" })
  .composite([
    { input: gradient, left: 0, top: 0 },
    { input: logo, left: 76, top: 70 },
  ])
  .png({ compressionLevel: 9, palette: true })
  .toFile("public/og.png");
