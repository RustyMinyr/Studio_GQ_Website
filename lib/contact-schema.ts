import { z } from "zod";

export const projectTypes = [
  "Photography",
  "Film production",
  "Podcast or interview",
  "Content creation",
  "Greenscreen production",
  "Commercial production",
  "Creative meeting",
  "Other",
] as const;

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(500).optional(),
);

const phoneNumber = z
  .string()
  .trim()
  .min(7, "Enter a phone number.")
  .max(30, "Phone number is too long.")
  .refine(
    (value) => /^[+()\-\s\d]+$/.test(value) && value.replace(/\D/g, "").length >= 7,
    "Enter a valid phone number.",
  );

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(100),
    company: z.string().trim().max(120).optional(),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    phone: phoneNumber,
    projectType: z.enum(projectTypes, {
      errorMap: () => ({ message: "Choose a project type." }),
    }),
    preferredDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a preferred date.")
      .refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
      }, "Choose a valid preferred date."),
    shootDays: z.coerce
      .number()
      .int("Enter a whole number of days.")
      .min(1, "At least one shoot day is required.")
      .max(60, "For longer bookings, include the details in your message."),
    crewSize: optionalNumber,
    message: z
      .string()
      .trim()
      .min(20, "Tell us a little more about your production.")
      .max(2000, "Keep your message under 2,000 characters."),
    website: z.string().trim().max(160).optional(),
  })
  .strict();

export type ContactFormData = z.infer<typeof contactSchema>;
