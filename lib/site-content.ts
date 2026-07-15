export const siteUrl = "https://www.studiogq.co.za";

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/equipment", label: "Equipment" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const contactDetails = {
  email: "bookings@studiogq.co.za",
  phoneDisplay: "+27 84 515 0956",
  phoneHref: "+27845150956",
  address: [
    "Unit 5, Moffett Business Centre",
    "8 Restitution Avenue",
    "Fairview",
    "Gqeberha",
    "South Africa",
  ],
} as const;

export const galleryImages = [
  {
    src: "/images/gallery/portrait-man-standing.webp",
    alt: "Full-length studio portrait of a man wearing a black jacket",
    caption: "Portrait production on the infinity curve",
  },
  {
    src: "/images/gallery/studio-production-wide.webp",
    alt: "Studio GQ infinity curve with talent, lighting and grip equipment",
    caption: "The infinity curve in full production",
  },
  {
    src: "/images/gallery/hair-makeup.webp",
    alt: "Hair stylist preparing talent in Studio GQ's makeup area",
    caption: "Hair, makeup and wardrobe preparation",
  },
  {
    src: "/images/gallery/behind-the-scenes.webp",
    alt: "Model in a black dress photographed on a Studio GQ set",
    caption: "A portrait set in progress",
  },
  {
    src: "/images/gallery/hair-makeup-detail.webp",
    alt: "Behind-the-scenes view of talent being prepared for a studio shoot",
    caption: "Production preparation",
  },
  {
    src: "/images/gallery/portrait-seated.webp",
    alt: "Low-key seated portrait photographed against a black backdrop",
    caption: "Low-key portrait lighting",
  },
  {
    src: "/images/gallery/portrait-seated-wide.webp",
    alt: "Wide behind-the-scenes view of a seated studio portrait",
    caption: "A controlled portrait setup",
  },
] as const;
