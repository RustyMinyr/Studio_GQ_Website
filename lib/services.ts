export type ServiceSection = {
  heading: string;
  body: string;
};

export type StudioService = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: readonly ServiceSection[];
  features: readonly string[];
  relatedResourceSlugs: readonly string[];
};

export const studioServices = [
  {
    slug: "studio-hire",
    title: "Professional studio hire in Gqeberha | Port Elizabeth.",
    seoTitle: "Studio Hire Gqeberha | Port Elizabeth",
    description:
      "Hire a private film, video and photography studio in Gqeberha | Port Elizabeth, Eastern Cape, for interviews, podcasts and content production.",
    eyebrow: "Studio hire",
    intro:
      "Studio GQ is a purpose-built studio in Gqeberha | Port Elizabeth for productions that need privacy, flexibility and a professional place to work. Plan the space around a focused portrait, a film or videography shoot, a podcast conversation or a larger content-production brief in the Eastern Cape.",
    sections: [
      {
        heading: "A space that adapts to the brief",
        body: "Flexible shooting spaces make it possible to plan different layouts around the intended frame and production workflow. Share the visual references, shot list and practical requirements early so the space can be considered as part of the production plan.",
      },
      {
        heading: "Keep preparation close to set",
        body: "On-site hair, makeup and wardrobe facilities give talent a dedicated place to prepare while remaining close to the studio. This helps the day move between preparation and capture without separating the working team.",
      },
      {
        heading: "Confirm the right session",
        body: "Online booking allows you to choose a preferred date and session before sharing the production details. Studio access, facilities, support and final inclusions are confirmed through the booking process.",
      },
    ],
    features: [
      "Private, professional studio hire",
      "Flexible shooting spaces with versatile layouts",
      "On-site hair, makeup and wardrobe facilities",
      "Suitable for film, photography, podcasting, interviews and content production",
      "Online date and session selection",
      "Located in Fairview, Gqeberha | Port Elizabeth, Eastern Cape",
    ],
    relatedResourceSlugs: [
      "half-day-vs-full-day-studio-hire",
      "studio-production-day-checklist",
      "infinity-curve-shooting-guide",
    ],
  },
  {
    slug: "photography-film",
    title: "Film, video and photography studio in Gqeberha | Port Elizabeth.",
    seoTitle: "Film, Video & Photography Studio Port Elizabeth",
    description:
      "A purpose-built film studio, video studio and photography studio in Gqeberha | Port Elizabeth, Eastern Cape, with adaptable spaces and production support.",
    eyebrow: "Film & photography",
    intro:
      "Build stills and motion work in one purpose-built creative environment. Studio GQ supports film, video, videography, photography, interviews and digital content in Gqeberha | Port Elizabeth, with specialist facilities and support arranged around the needs of each Eastern Cape production.",
    sections: [
      {
        heading: "Plan the space around the image",
        body: "Portrait, product, interview and motion setups all place different demands on framing, lighting and movement. Flexible layouts allow the production to organise the studio around the intended result rather than force every shoot into the same format.",
      },
      {
        heading: "Shape a consistent lighting approach",
        body: "Professional lighting and grip equipment is available on-site, while stands, modifiers and production accessories can be considered around the working lighting plan. Availability can vary, so include the intended setup and equipment list with the enquiry.",
      },
      {
        heading: "Add support where the production needs it",
        body: "Experienced crew and production support can be discussed around the scale and requirements of the job. Note any roles or assistance you need so these can be considered before the shoot.",
      },
    ],
    features: [
      "Purpose-built space for film, photography and content production",
      "Flexible studio layouts",
      "Infinity curve and greenscreen studio facilities",
      "Professional lighting and grip equipment available on-site",
      "Working selection of stands for lights, modifiers and production accessories",
      "Experienced crew and production support available for discussion",
    ],
    relatedResourceSlugs: [
      "studio-lighting-basics",
      "stills-vs-video-lighting",
      "greenscreen-shoot-preparation",
    ],
  },
  {
    slug: "podcast-studio",
    title: "Podcast studio in Gqeberha | Port Elizabeth.",
    seoTitle: "Podcast Studio Gqeberha | Port Elizabeth",
    description:
      "Record podcasts, filmed interviews and spoken-word content in an acoustically treated studio in Gqeberha | Port Elizabeth, Eastern Cape.",
    eyebrow: "Podcast & audio",
    intro:
      "Studio GQ provides an acoustically treated podcast studio in Gqeberha | Port Elizabeth for podcasts, recorded interviews and spoken-word formats. Plan the room around the number of speakers, the conversation and whether the Eastern Cape production also needs to work on camera.",
    sections: [
      {
        heading: "Give the conversation a suitable space",
        body: "A podcast setup should keep speakers comfortable while protecting clear microphone positions and useful camera angles. Tell the team how many people will be recorded and whether the session is audio-only or filmed so the requirements can be discussed together.",
      },
      {
        heading: "Bring audio and picture into one plan",
        body: "The studio supports both podcast conversations and recorded interviews. Audio resources and podcast equipment may be available, while the flexible space can accommodate visual content requirements around the discussion.",
      },
      {
        heading: "Confirm what the recording needs",
        body: "Equipment and support can vary by production. Include the intended format, speaker count, recording approach and any crew assistance in the enquiry so the team can confirm the available package.",
      },
    ],
    features: [
      "Acoustically treated podcast space",
      "Suitable for podcasts, interviews and spoken-word formats",
      "Podcast equipment support",
      "Audio resources for interviews, dialogue and selected content formats",
      "Flexible layouts for creative production requirements",
      "Production support available for discussion",
    ],
    relatedResourceSlugs: [
      "podcast-studio-setup-guide",
      "clean-interview-sound",
      "studio-production-day-checklist",
    ],
  },
  {
    slug: "greenscreen-infinity-curve",
    title: "Greenscreen and infinity curve studio in Gqeberha | Port Elizabeth.",
    seoTitle: "Greenscreen Studio Gqeberha | Port Elizabeth",
    description:
      "Shoot film, video, photography and digital content in a greenscreen studio or on a seamless infinity curve in Gqeberha | Port Elizabeth, Eastern Cape.",
    eyebrow: "Specialist spaces",
    intro:
      "Create clean studio frames on a seamless infinity curve or prepare composited work in the Studio GQ greenscreen studio. Both facilities give film, video, photography and digital-content productions in Gqeberha | Port Elizabeth a controlled starting point for the final image.",
    sections: [
      {
        heading: "A seamless base for clean frames",
        body: "The infinity curve creates a continuous transition between the floor and background for portraits, motion and other studio work. Plan the intended background tone, widest frame and movement area before finalising the setup.",
      },
      {
        heading: "Prepare greenscreen work for the final composite",
        body: "The greenscreen setup supports film, video and digital content. Share the intended background, framing and subject movement early so wardrobe, lighting and practical production needs can be planned with the final result in mind.",
      },
      {
        heading: "Build the rest of the setup around the shot",
        body: "Lighting, grip, stands and production assistance can be discussed alongside the chosen studio facility. Send a working equipment list so Studio GQ can confirm what is available and identify any additional hire requirements.",
      },
    ],
    features: [
      "Seamless infinity curve",
      "Greenscreen studio setup",
      "Suitable for film, video, photography and digital content",
      "Flexible shooting layouts",
      "Lighting, grip and stands may be available",
      "Production assistance arranged around the needs of the brief",
    ],
    relatedResourceSlugs: [
      "greenscreen-shoot-preparation",
      "infinity-curve-shooting-guide",
      "studio-lighting-basics",
    ],
  },
  {
    slug: "equipment-production-support",
    title: "Studio equipment and production support in the Eastern Cape.",
    seoTitle: "Studio Equipment & Production Support Eastern Cape",
    description:
      "Plan lighting, grip, stands, backdrops, audio and production support for film, video and photography shoots in Gqeberha | Port Elizabeth, Eastern Cape.",
    eyebrow: "Equipment & support",
    intro:
      "Build the working package around the production rather than choosing equipment in isolation. Studio GQ can confirm available lighting, grip, stands, backdrops, audio and podcast equipment, then discuss additional hire or production support for work in Gqeberha | Port Elizabeth and across the Eastern Cape.",
    sections: [
      {
        heading: "Start with the shot and working list",
        body: "Portrait, product, interview and motion work each require a different combination of control, support and capture equipment. Share the intended result and a working equipment list early so availability can be checked before the production day.",
      },
      {
        heading: "Cover lighting, audio and the set",
        body: "Available categories may include lighting, grip, stands, backdrops, audio resources and podcast equipment. Final equipment and facilities are confirmed for each booking rather than assumed as standard inclusions.",
      },
      {
        heading: "Add people and support where needed",
        body: "Experienced crew and production support can be discussed around the scale of the job. Note the required roles, practical assistance and specialist requests in the enquiry so they can be planned and quoted separately where applicable.",
      },
    ],
    features: [
      "Flexible lighting options for portrait, product, interview and motion setups",
      "Grip equipment for shaping, controlling and supporting a lighting plan",
      "Working selection of stands for lights, modifiers and production accessories",
      "Backdrop options for different looks and capture requirements",
      "Audio and podcast equipment support",
      "Experienced crew and production support available for discussion",
    ],
    relatedResourceSlugs: [
      "studio-lighting-basics",
      "stills-vs-video-lighting",
      "studio-production-day-checklist",
    ],
  },
] as const satisfies readonly StudioService[];

export function getStudioService(slug: string): StudioService | undefined {
  return studioServices.find((service) => service.slug === slug);
}
