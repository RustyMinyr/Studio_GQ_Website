export const siteUrl = "https://www.studiogq.co.za";

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
  ...primaryNavigation,
  { href: "/booking", label: "Booking" },
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
