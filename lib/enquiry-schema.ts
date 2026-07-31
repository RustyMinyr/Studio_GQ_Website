import { z } from "zod";

const requestId = z.string().uuid("The enquiry could not be identified.");
const email = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");
const website = z.string().trim().max(200).optional().default("");
const phone = z.string().trim().max(40, "Phone number is too long.").optional().default("");

export const enquirySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("quick_enquiry"),
    requestId,
    name: z.string().trim().min(2, "Enter your name.").max(120, "Name is too long."),
    email,
    phone,
    message: z
      .string()
      .trim()
      .min(5, "Tell us briefly how we can help.")
      .max(1500, "Keep the enquiry under 1,500 characters."),
    website,
  }),
  z.object({
    kind: z.literal("workshop_interest"),
    requestId,
    name: z.string().trim().min(2, "Enter your name.").max(120, "Name is too long."),
    email,
    phone,
    message: z
      .string()
      .trim()
      .max(1000, "Keep the note under 1,000 characters.")
      .optional()
      .default(""),
    website,
  }),
  z.object({
    kind: z.literal("newsletter"),
    requestId,
    email,
    website,
  }),
]);

export type EnquiryData = z.infer<typeof enquirySchema>;
