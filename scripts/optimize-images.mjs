import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const sources = [
  "assets/source-images/hero-studio-gq.jpg",
  "assets/source-images/studio-infinity-curve-group.jpg",
  "assets/source-images/gallery/portrait-man-standing.jpg",
  "assets/source-images/gallery/studio-production-wide.jpg",
  "assets/source-images/gallery/hair-makeup.jpg",
  "assets/source-images/gallery/behind-the-scenes.jpg",
  "assets/source-images/gallery/hair-makeup-detail.jpg",
  "assets/source-images/gallery/portrait-seated.jpg",
  "assets/source-images/gallery/portrait-seated-wide.jpg",
];

for (const source of sources) {
  const destination = source
    .replace(/^assets\/source-images/, "public/images")
    .replace(/\.jpg$/i, ".webp");
  await sharp(source)
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, smartSubsample: true })
    .toFile(destination);
}

await Promise.all([
  sharp("public/logos/studio-gq-white-transparent.svg")
    .resize(320, 320, { fit: "contain" })
    .png({ compressionLevel: 9, palette: true })
    .toFile("public/logos/studio-gq-white.png"),
  sharp("public/logos/studio-gq-black-transparent.svg")
    .resize(320, 320, { fit: "contain" })
    .png({ compressionLevel: 9, palette: true })
    .toFile("public/logos/studio-gq-black.png"),
]);
