export type ResourceSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type ResourceArticle = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  readTimeMinutes: number;
  publishedAt: string;
  introduction: string;
  sections: readonly ResourceSection[];
  checklist: readonly string[];
  ctaBody: string;
  relatedServiceSlug: string;
  relatedResourceSlugs: readonly string[];
  featured: boolean;
};

export const resourceArticles = [
  {
    slug: "studio-lighting-basics",
    title: "Studio lighting basics: shape the subject before adding more light",
    seoTitle: "Studio Lighting Basics: A Practical Guide",
    description:
      "A practical introduction to key light, fill, contrast and background control for cleaner, more intentional studio images.",
    category: "Lighting",
    readTimeMinutes: 6,
    publishedAt: "2026-07-31",
    introduction:
      "Good studio lighting is less about using every fixture available and more about deciding what the viewer should notice first. Start with the subject, build one light at a time and judge every change by what it adds to the frame. This simple approach makes lighting easier to repeat, easier to troubleshoot and easier to adapt for photography or motion.",
    sections: [
      {
        heading: "Begin with the result, not the equipment",
        paragraphs: [
          "Before switching on a light, define the feeling and purpose of the image. A clean product photograph, a dramatic portrait and a relaxed interview need different contrast, direction and background treatment. Look at the subject’s face, clothing, surface texture and movement. Then decide whether the light should feel soft and open, hard and graphic, or somewhere between the two.",
          "The clearest starting point is one key light. Move it closer or further away, change its height and adjust its angle until the shape on the subject feels right. Only add another source when you can explain the problem it is solving.",
        ],
      },
      {
        heading: "Understand direction and softness",
        paragraphs: [
          "Light direction creates shape. A source close to the camera produces a flatter result; moving it to the side reveals more texture and facial structure. Raising it can create a natural downward shadow, while a low source may feel less familiar or more stylised.",
          "Softness depends largely on the apparent size of the source in relation to the subject. A larger, closer source usually produces gentler transitions between light and shadow. A smaller or more distant source tends to create harder edges. Neither is automatically better — the choice should serve the shot.",
        ],
      },
      {
        heading: "Control contrast before adding fill",
        paragraphs: [
          "If the shadow side is too dark, a fill light is only one option. A reflector can return some of the key light, while a white surface may lift the shadows subtly. If the image feels too flat, negative fill — a dark surface placed near the subject — can reduce stray light and restore shape.",
          "Make these changes in small steps. The goal is not always to eliminate shadows; it is to control them.",
        ],
      },
      {
        heading: "Treat the background as a separate decision",
        paragraphs: [
          "A background can be bright, dark, even or deliberately graduated. Subject-to-background distance affects both the look and how much spill reaches the set behind them. Where possible, establish the subject lighting first and then decide whether the background needs its own source, flag or adjustment.",
          "Keep an eye on separation. Similar tones in wardrobe, hair and background can merge unless the lighting or composition creates a clear edge.",
        ],
      },
    ],
    checklist: [
      "Define the mood and purpose of the shot.",
      "Build the setup with one key light first.",
      "Adjust distance, height and angle before adding another source.",
      "Use reflection or negative fill to shape contrast.",
      "Check the subject and background separately.",
      "Confirm exposure, white balance and skin tone on the intended camera.",
      "Take a reference frame before changing the setup.",
    ],
    ctaBody:
      "Planning a portrait, product shoot or interview? Share the intended look with Studio GQ when you enquire, and the team can help you plan the space and production requirements around the shot.",
    relatedServiceSlug: "equipment-production-support",
    relatedResourceSlugs: [
      "stills-vs-video-lighting",
      "greenscreen-shoot-preparation",
      "infinity-curve-shooting-guide",
    ],
    featured: true,
  },
  {
    slug: "stills-vs-video-lighting",
    title: "Stills vs video lighting: what changes when the image starts moving?",
    seoTitle: "Stills vs Video Lighting: What Changes?",
    description:
      "Understand the practical differences between lighting a single photograph and maintaining a consistent moving image.",
    category: "Lighting",
    readTimeMinutes: 7,
    publishedAt: "2026-07-31",
    introduction:
      "Stills and video productions often use the same lighting principles, but they do not always ask the lights to do the same job. A photographer may shape one exact moment. A film crew must preserve the look while the subject moves, speaks and repeats an action. Knowing where the workflows differ helps a team choose an efficient setup from the start.",
    sections: [
      {
        heading: "A still frame can be more tightly controlled",
        paragraphs: [
          "Photography can be built around a precise pose, camera position and instant of exposure. Flash can deliver a short, powerful burst that freezes motion, while the photographer reviews each frame and makes fine adjustments between takes.",
          "Video relies on light that remains present throughout the shot. The camera records movement over time, so output, flicker behaviour, colour consistency and exposure must remain stable for the duration of the take. The lighting also needs to work at the chosen frame rate and shutter settings.",
        ],
      },
      {
        heading: "Movement changes the size of the usable area",
        paragraphs: [
          "A portrait subject may stay on a mark, but an interview guest may lean forward and a presenter may walk through the frame. For video, it is important to light the whole performance area rather than only the starting position.",
          "Marking positions and rehearsing the action can reveal exposure changes, unwanted shadows and reflections before recording begins. A wider pool of light may be more practical than a highly precise setup if the subject needs freedom to move.",
        ],
      },
      {
        heading: "Continuity matters across angles and takes",
        paragraphs: [
          "A stills session can change direction quickly between images. Video scenes need visual continuity across wide shots, close-ups and repeated takes. Fixtures, stands and flags should be positioned so that the team can change camera angles without rebuilding the entire setup.",
          "Take lighting reference images and note important settings. If the production pauses or returns to the setup, those references make it easier to recreate the look.",
        ],
      },
      {
        heading: "Plan around sound, heat, power and access",
        paragraphs: [
          "Video sets usually stay lit for longer and may be recording dialogue. Fan noise, cable routes, heat around talent and safe access through the set all need consideration. The most visually impressive position is not useful if it blocks a camera move, places a cable in a walkway or introduces noise into a quiet interview.",
          "Stills teams need many of the same safety checks, but the longer running time of video makes them especially important.",
        ],
      },
    ],
    checklist: [
      "Confirm whether the project is stills, video or both.",
      "Decide whether flash, continuous light or a combined workflow is required.",
      "Test the full movement area, not only the starting mark.",
      "Check for flicker at the intended frame rate and shutter settings.",
      "Plan camera angles before finalising stand positions.",
      "Record reference frames and key lighting settings.",
      "Keep cables, heat, sound and crew access in mind.",
    ],
    ctaBody:
      "If your production includes both photography and video, include that in the brief. Studio GQ can help you allow enough setup time and identify the studio requirements before the shoot.",
    relatedServiceSlug: "photography-film",
    relatedResourceSlugs: [
      "studio-lighting-basics",
      "greenscreen-shoot-preparation",
      "studio-production-day-checklist",
    ],
    featured: true,
  },
  {
    slug: "clean-interview-sound",
    title: "How to record cleaner interview sound in a studio",
    seoTitle: "How to Record Cleaner Interview Sound",
    description:
      "Practical steps for choosing a quiet setup, placing microphones well and catching problems before the interview begins.",
    category: "Sound",
    readTimeMinutes: 6,
    publishedAt: "2026-07-31",
    introduction:
      "Viewers will often accept a simple picture more readily than unclear dialogue. Clean interview sound begins before the record button: with the room, microphone position, clothing, crew movement and monitoring. A short sound check can prevent an otherwise strong interview from becoming difficult to use.",
    sections: [
      {
        heading: "Listen to the space before setting up",
        paragraphs: [
          "Stand quietly in the intended recording position and listen. Air-conditioning, traffic, phones, lights, nearby conversations and moving chairs can all become more noticeable through a microphone. Identify what can be switched off, moved or scheduled around.",
          "Also listen for the character of the room. Hard, empty spaces reflect more sound, while soft surfaces and acoustic treatment can reduce unwanted reflections. The objective is not always a completely dry recording, but speech should remain clear and consistent.",
        ],
      },
      {
        heading: "Put the microphone close enough",
        paragraphs: [
          "Distance is one of the biggest influences on dialogue quality. A microphone positioned close to the speaker usually captures more voice and less room. Whether the production uses a lavalier, boom or another approach, placement should remain consistent as the guest moves naturally.",
          "Check lavalier placement for clothing rustle, jewellery and hair contact. With a boom, keep the microphone close without entering the frame or creating a shadow. Placement should be checked again after wardrobe or camera changes.",
        ],
      },
      {
        heading: "Monitor the actual recording",
        paragraphs: [
          "Meters show level, but headphones reveal hum, distortion, interference and handling noise. Someone should listen throughout the interview, not only during the initial test. If a problem appears, stop and fix it while the speaker is still available.",
          "Set conservative levels that leave room for laughter or a louder answer. A clean recording with headroom is more useful than one that clips at its strongest moment.",
        ],
      },
      {
        heading: "Capture room tone and useful redundancy",
        paragraphs: [
          "Record a short period of silence with everyone in position. This room tone can help an editor smooth gaps between answers. Where the production allows it, a second recording path can provide protection against a cable, battery or placement problem.",
          "Before the guest leaves, review a representative section with both picture and sound. Do not rely only on the fact that the recorder was running.",
        ],
      },
    ],
    checklist: [
      "Listen for noise before bringing the guest onto set.",
      "Silence phones and manage avoidable background sound.",
      "Check microphone distance and clothing contact.",
      "Set levels with enough headroom for louder speech.",
      "Monitor with headphones throughout the interview.",
      "Record room tone after the setup is final.",
      "Review a sample before the guest leaves.",
    ],
    ctaBody:
      "Recording an interview or testimonial? Tell Studio GQ how many speakers and cameras you expect so the studio and sound requirements can be considered together.",
    relatedServiceSlug: "podcast-studio",
    relatedResourceSlugs: ["podcast-studio-setup-guide", "studio-production-day-checklist"],
    featured: true,
  },
  {
    slug: "podcast-studio-setup-guide",
    title: "Planning a podcast studio setup that works on camera and in the edit",
    seoTitle: "Planning a Podcast Studio Setup",
    description:
      "A practical guide to arranging speakers, microphones, cameras and lighting for a podcast that is comfortable to record and straightforward to edit.",
    category: "Podcasting",
    readTimeMinutes: 7,
    publishedAt: "2026-07-31",
    introduction:
      "A podcast setup needs to work for the conversation first. Guests should be able to see and hear one another, microphones should stay in useful positions, and cameras should have clean views without turning the space into an obstacle course. A little planning before the session improves both the recording and the edit.",
    sections: [
      {
        heading: "Start with the format",
        paragraphs: [
          "Define how many people will speak, whether anyone will join remotely, and whether the episode is audio-only or filmed. A host-and-guest conversation needs a different layout from a round-table discussion or solo presentation.",
          "Decide how the episode will begin, whether there are recurring segments, and how long the recording is expected to run. This shapes the seating, camera coverage, media requirements and amount of time needed in the studio.",
        ],
      },
      {
        heading: "Arrange people for conversation and camera coverage",
        paragraphs: [
          "Guests should not have to choose between looking at one another and facing the camera. Place seats so the conversation feels natural while each camera retains a clear angle. Check eyelines, chair height and the space available for microphones before locking the layout.",
          "If the production uses multiple cameras, ensure that microphones, stands and lights do not intrude into another angle. Record a short test with everyone seated and moving as they normally would.",
        ],
      },
      {
        heading: "Keep every voice consistent",
        paragraphs: [
          "Each speaker should have a suitable, stable microphone position. Match levels by listening to normal conversation, not only a formal count. People may turn their heads, lean back or speak more energetically once the discussion begins, so the setup should tolerate natural movement.",
          "Monitor the recording throughout. A visible waveform does not confirm that every voice is clean or that a cable has remained quiet.",
        ],
      },
      {
        heading: "Build a simple visual identity",
        paragraphs: [
          "The set should support the programme without distracting from it. Consider background depth, practical lights, brand elements and wardrobe together. Avoid fine patterns, highly reflective objects and competing colours that make the frame unnecessarily busy.",
          "For a recurring podcast, save reference photographs of the seating, framing and lighting. Consistency helps separate episodes feel like one series.",
        ],
      },
      {
        heading: "Leave time for checks and pickups",
        paragraphs: [
          "Plan a short technical test before the main discussion. Confirm that all cameras are recording, audio is reaching the intended destinations and media has enough capacity. After the conversation, capture any introductions, sponsor lines or corrections while the guests and setup are still available.",
        ],
      },
    ],
    checklist: [
      "Confirm the number of speakers and whether anyone is remote.",
      "Decide between audio-only and filmed delivery.",
      "Plan seating, eyelines and camera angles together.",
      "Test every microphone at normal speaking level.",
      "Monitor sound and camera recording during the session.",
      "Photograph the final setup for future episodes.",
      "Allow time for introductions, pickups and a file check.",
    ],
    ctaBody:
      "Developing a new podcast or returning series? Bring Studio GQ the intended format and guest count early so the session can be planned around the conversation.",
    relatedServiceSlug: "podcast-studio",
    relatedResourceSlugs: [
      "clean-interview-sound",
      "studio-lighting-basics",
      "studio-production-day-checklist",
    ],
    featured: false,
  },
  {
    slug: "greenscreen-shoot-preparation",
    title: "Greenscreen preparation: what to decide before shoot day",
    seoTitle: "Greenscreen Shoot Preparation Guide",
    description:
      "Wardrobe, lighting, movement and background planning for a cleaner greenscreen key and a more convincing final composite.",
    category: "Production",
    readTimeMinutes: 7,
    publishedAt: "2026-07-31",
    introduction:
      "Greenscreen work is easiest when the final background is considered before the subject is filmed. Wardrobe, lens choice, light direction, movement and camera height should all make sense inside the intended composite. Treating the screen as only a green backdrop leaves too many decisions for post-production.",
    sections: [
      {
        heading: "Design the final frame first",
        paragraphs: [
          "Obtain a reference for the replacement background, even if it is only a sketch. Note the direction and softness of its light, the camera height, perspective and expected subject size. The studio lighting should support those cues so the subject belongs in the finished environment.",
          "Also decide whether the frame needs a full body, seated subject or close-up. This determines how much screen coverage and floor area must remain clean.",
        ],
      },
      {
        heading: "Separate the subject from the screen",
        paragraphs: [
          "Distance helps reduce green spill and allows the screen and subject to be lit more independently. The exact layout depends on the shot, but avoid placing the subject against the screen unless the creative approach has been tested.",
          "Keep the screen illumination as even as practical across the area that will actually appear behind the subject. There is no advantage in perfecting parts of the screen that are outside the frame while neglecting the performance area.",
        ],
      },
      {
        heading: "Choose wardrobe and props carefully",
        paragraphs: [
          "Avoid green clothing, transparent fabrics and highly reflective surfaces unless the post-production approach accounts for them. Fine hair, motion blur and translucent objects can also make the key more demanding.",
          "Wardrobe should be tested on camera rather than judged by eye alone. Bring alternatives when possible, particularly if branding or costume colours are close to the screen colour.",
        ],
      },
      {
        heading: "Track movement and interaction",
        paragraphs: [
          "Rehearse the subject’s complete movement. Check that hands, props and shadows remain inside the usable screen area. If the final composite requires camera movement or accurate positioning, discuss reference markers and tracking requirements before the screen is lit.",
          "Whenever the subject must interact with a digital object or environment, provide clear eyelines and physical reference points on set.",
        ],
      },
    ],
    checklist: [
      "Bring a reference for the intended background.",
      "Match camera height, perspective and lighting direction to the composite.",
      "Confirm the required framing and movement area.",
      "Avoid green, reflective or translucent wardrobe where practical.",
      "Test fine hair, motion blur and props before the main take.",
      "Keep the subject separated from the screen where the shot allows.",
      "Capture clean plates and tracking references when required.",
    ],
    ctaBody:
      "If the project includes greenscreen, share a background reference and framing plan with Studio GQ before booking. It will help the team understand the space, lighting and support the production may require.",
    relatedServiceSlug: "greenscreen-infinity-curve",
    relatedResourceSlugs: [
      "studio-lighting-basics",
      "stills-vs-video-lighting",
      "infinity-curve-shooting-guide",
    ],
    featured: false,
  },
  {
    slug: "infinity-curve-shooting-guide",
    title: "Shooting on an infinity curve: cleaner frames begin with careful preparation",
    seoTitle: "Shooting on an Infinity Curve: A Practical Guide",
    description:
      "How to plan composition, lighting, movement and set care when working on a seamless studio curve.",
    category: "Studio craft",
    readTimeMinutes: 6,
    publishedAt: "2026-07-31",
    introduction:
      "An infinity curve creates the impression that the floor and background continue without an edge. It can make portraits, products and full-body movement feel clean and expansive, but the simplicity of the frame makes every footprint, shadow and exposure change more visible. Preparation is what keeps the result seamless.",
    sections: [
      {
        heading: "Decide whether the background should be white, grey or tonal",
        paragraphs: [
          "The same surface can appear very different depending on exposure and lighting. A bright white result requires enough controlled background illumination, while a grey or graduated background may rely on separation and fall-off. Define the intended tone before building the subject lighting.",
          "Do not judge the curve only by eye. Use the camera and intended exposure settings, because the recorded image determines whether the background reads as clean, textured or uneven.",
        ],
      },
      {
        heading: "Give the subject room to separate",
        paragraphs: [
          "Moving the subject away from the background can reduce unwanted shadows and make the lighting easier to control. It also creates more flexibility when the subject needs an edge or rim of separation.",
          "For full-body work, check where feet, props and clothing fall within the lit area. A wide composition may reveal parts of the curve that were not important in a tighter test.",
        ],
      },
      {
        heading: "Protect the shooting surface",
        paragraphs: [
          "The floor is part of the image. Limit unnecessary traffic, clean footwear when required and keep drinks, tape residue and equipment edges away from the visible area. Plan stand and cable positions so that the team can work safely without repeatedly crossing the set.",
          "If the production involves messy materials, heavy props or unusual movement, discuss it before the booking. That allows the studio to assess preparation and protection requirements.",
        ],
      },
      {
        heading: "Test the widest and most active frame",
        paragraphs: [
          "Start by checking the shot that uses the most space. Rehearse jumps, walking, group positions or prop movement before finalising the lights. This reveals whether shadows leave the intended area and whether the background remains even across the complete action.",
          "Once the wide setup works, tighter frames are usually easier to manage.",
        ],
      },
    ],
    checklist: [
      "Define the intended background tone before lighting.",
      "Test the curve through the production camera.",
      "Check the widest composition and full movement area.",
      "Allow enough separation to control shadows and spill.",
      "Keep the visible floor clean and unnecessary traffic off it.",
      "Plan cables and stands around safe crew movement.",
      "Tell the studio about messy materials or heavy props in advance.",
    ],
    ctaBody:
      "Planning a clean portrait, fashion, product or movement shoot? Send Studio GQ a reference and your widest intended frame so the infinity-curve setup can be considered properly.",
    relatedServiceSlug: "greenscreen-infinity-curve",
    relatedResourceSlugs: [
      "studio-lighting-basics",
      "greenscreen-shoot-preparation",
      "studio-production-day-checklist",
    ],
    featured: false,
  },
  {
    slug: "half-day-vs-full-day-studio-hire",
    title: "Half-day or full-day studio hire: how much shoot time do you really need?",
    seoTitle: "Half-Day vs Full-Day Studio Hire",
    description:
      "A practical way to estimate setup, shooting, changes and wrap time before choosing a studio session.",
    category: "Planning",
    readTimeMinutes: 6,
    publishedAt: "2026-07-31",
    introduction:
      "The camera may only be recording for part of a studio booking. Load-in, lighting, sound checks, wardrobe, rehearsals, set changes, file reviews and wrap all use the same session time. Choosing between a half day and a full day is easier when the whole production is scheduled, not only the shot list.",
    sections: [
      {
        heading: "Count setups, not only final images",
        paragraphs: [
          "A setup changes when the team moves the camera, rebuilds the lighting, changes the background or rearranges the set. Ten photographs on one lighting setup may be quicker than three deliverables that each require a different look.",
          "List every meaningful change and estimate how long it takes to move from one to the next. Include a short approval window if a client or stakeholder needs to review the result.",
        ],
      },
      {
        heading: "Be realistic about arrival and preparation",
        paragraphs: [
          "Talent rarely steps directly from the door onto a finished set. Allow for load-in, parking, wardrobe, hair and makeup, microphone fitting and briefing. If several departments arrive together, decide who needs access first so the space does not become congested.",
          "A pre-light or prepared set may change the schedule, but it should never be assumed. Confirm what is possible with the studio before building the call sheet.",
        ],
      },
      {
        heading: "A half day works best with a focused brief",
        paragraphs: [
          "A shorter session can suit a single interview, straightforward portrait set, product batch or repeatable content format when the team is prepared. References, shot order, wardrobe and approvals should be settled before arrival.",
          "If the brief is still evolving, the shorter booking leaves less room to experiment or recover from delays.",
        ],
      },
      {
        heading: "A full day creates room for complexity",
        paragraphs: [
          "A longer session is often more appropriate for multiple looks, larger crews, detailed lighting, several contributors or a combination of stills and video. It also allows time for breaks, file checks and controlled changes without pushing every department at once.",
          "More time should still be scheduled carefully. A full day is most useful when the team knows how it will be used.",
        ],
      },
    ],
    checklist: [
      "List each lighting, camera, background and set change.",
      "Include load-in, styling, rehearsal, breaks and wrap.",
      "Confirm how many people need to be recorded or photographed.",
      "Decide when client approvals will happen.",
      "Allow time to review files before striking the setup.",
      "Build a small contingency into the schedule.",
      "Share the working timetable with the studio before the day.",
    ],
    ctaBody:
      "Unsure which session fits the brief? Send Studio GQ the shot list, number of setups and crew plan. The team can help you identify whether a focused half day or a fuller production day is the more realistic choice.",
    relatedServiceSlug: "studio-hire",
    relatedResourceSlugs: ["studio-production-day-checklist", "stills-vs-video-lighting"],
    featured: false,
  },
  {
    slug: "studio-production-day-checklist",
    title: "A practical studio production-day checklist",
    seoTitle: "A Practical Studio Production-Day Checklist",
    description:
      "The essential checks that help a photography, film, interview or podcast session start cleanly and wrap with confidence.",
    category: "Planning",
    readTimeMinutes: 7,
    publishedAt: "2026-07-31",
    introduction:
      "A smooth studio day is usually the result of decisions made before anyone arrives. The purpose of a checklist is not to make a small shoot feel complicated; it is to keep simple details from consuming creative time. Use this as a starting point and adapt it to the size and risk of the production.",
    sections: [
      {
        heading: "Confirm the brief and responsibilities",
        paragraphs: [
          "Circulate the latest brief, shot list, references and schedule to everyone who needs them. Make it clear who approves the creative, who manages the client, who is responsible for camera and sound, and who confirms that files are secure before wrap.",
          "Check the final crew, talent and visitor list. Confirm arrival times, access needs, dietary requirements where applicable and a reliable contact person for the day.",
        ],
      },
      {
        heading: "Prepare media, power and backups",
        paragraphs: [
          "Format media only after confirming that existing material is safely stored. Charge batteries, label cards and assign responsibility for media handling. Estimate storage based on the recording format and expected duration rather than relying on empty-card counts alone.",
          "Decide how files will be copied and checked during the day. A backup process is strongest when one named person owns it and records what has been completed.",
        ],
      },
      {
        heading: "Build the day in a sensible order",
        paragraphs: [
          "Schedule the most demanding setup with enough preparation time. Group shots that share lighting, camera or wardrobe to reduce unnecessary resets. If talent availability is limited, prioritise the material that cannot be recreated later.",
          "Allow time for technical tests before the first important take. A short camera, lighting and sound review is more valuable than discovering a problem after the set has changed.",
        ],
      },
      {
        heading: "Protect people, equipment and the space",
        paragraphs: [
          "Keep exits and walkways clear. Secure cables, stabilise stands and brief the team on moving equipment. Flag any unusual props, liquids, smoke effects, high loads or energetic movement with the studio before the day.",
          "Build breaks into longer schedules. Fatigue affects communication and safety as much as performance.",
        ],
      },
      {
        heading: "Wrap methodically",
        paragraphs: [
          "Before dismantling the final setup, review representative files and confirm that essential shots and audio have been captured. Record any missing material or approved changes. Return the studio to the agreed condition, check personal equipment and complete the backup handover.",
          "The best time to find a missing shot is while the talent, crew and set are still together.",
        ],
      },
    ],
    checklist: [
      "Final brief, shot list, references and call times circulated.",
      "Crew, talent, access and contact details confirmed.",
      "Batteries charged and recording media prepared.",
      "Backup owner and file process assigned.",
      "Lighting, camera and sound tests scheduled.",
      "Safety, unusual props and movement discussed in advance.",
      "Essential files reviewed before the final setup is struck.",
      "Studio, equipment and media checked at wrap.",
    ],
    ctaBody:
      "Once the production plan is taking shape, share the schedule and requirements with Studio GQ. Clear information early helps the studio support a more focused day. Watch for the upcoming free practical workshops from Studio GQ and FilmHouse for more real-world production guidance.",
    relatedServiceSlug: "studio-hire",
    relatedResourceSlugs: [
      "half-day-vs-full-day-studio-hire",
      "clean-interview-sound",
      "podcast-studio-setup-guide",
    ],
    featured: false,
  },
] as const satisfies readonly ResourceArticle[];

export const featuredResourceArticles = resourceArticles.filter((article) => article.featured);

export function getResourceArticle(slug: string): ResourceArticle | undefined {
  return resourceArticles.find((article) => article.slug === slug);
}
