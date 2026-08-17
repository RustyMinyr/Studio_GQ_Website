export const siteUrl = "https://www.studiogq.co.za";
export const seoContentUpdatedAt = "2026-08-17";

export const studioLocation = {
  displayName: "Gqeberha | Port Elizabeth",
  streetAddress: "Unit 5, Moffett Business Centre, 8 Restitution Avenue",
  suburb: "Fairview",
  locality: "Gqeberha",
  alternateLocality: "Port Elizabeth",
  region: "Eastern Cape",
  postalCode: "6070",
  countryCode: "ZA",
  countryName: "South Africa",
  latitude: -33.971937,
  longitude: 25.553187,
  plusCode: "4GR72HH3+67",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Studio%20GQ%20Gqeberha",
} as const;

export const studioServiceAreas = [
  { "@type": "City", name: "Gqeberha" },
  { "@type": "City", name: "Port Elizabeth" },
  { "@type": "AdministrativeArea", name: "Nelson Mandela Bay" },
  { "@type": "AdministrativeArea", name: "Eastern Cape" },
] as const;

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#equipment", label: "Equipment" },
  { href: "/#learn", label: "Learn" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
] as const;

export const footerNavigation = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#equipment", label: "Equipment" },
  { href: "/resources", label: "Learn" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
  { href: "/booking", label: "Booking" },
] as const;

export const contactDetails = {
  email: "bookings@studiogq.co.za",
  phoneDisplay: "+27 84 515 0956",
  phoneHref: "+27845150956",
  address: [
    "Unit 5, Moffett Business Centre",
    "8 Restitution Avenue, Fairview",
    "Gqeberha | Port Elizabeth",
    "Eastern Cape, 6070",
    "South Africa",
  ],
} as const;
