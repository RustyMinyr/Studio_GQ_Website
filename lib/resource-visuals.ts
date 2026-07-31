export type ResourceVisual = {
  src: string;
  alt: string;
  position?: string;
};

const resourceVisuals: Record<string, ResourceVisual> = {
  "studio-lighting-basics": {
    src: "/images/resources/learn-lighting-demonstration.webp",
    alt: "A seated subject being lit during a practical demonstration inside Studio GQ",
    position: "center",
  },
  "stills-vs-video-lighting": {
    src: "/images/resources/learn-camera-monitor.webp",
    alt: "A camera monitor framing a portrait during a Studio GQ production",
    position: "center",
  },
  "clean-interview-sound": {
    src: "/images/resources/learn-portrait-setup.webp",
    alt: "A seated subject framed during an intimate studio production setup",
    position: "center",
  },
  "podcast-studio-setup-guide": {
    src: "/images/resources/learn-conversation-space.webp",
    alt: "People seated in Studio GQ's adaptable conversation space",
    position: "center",
  },
  "greenscreen-shoot-preparation": {
    src: "/images/resources/learn-softbox-pair.webp",
    alt: "Two subjects positioned beside a large softbox during a studio setup",
    position: "center",
  },
  "infinity-curve-shooting-guide": {
    src: "/images/resources/learn-infinity-curve.webp",
    alt: "A portrait subject seated on Studio GQ's white infinity curve",
    position: "center",
  },
  "half-day-vs-full-day-studio-hire": {
    src: "/images/resources/learn-group-lighting.webp",
    alt: "A multi-person production being photographed inside Studio GQ",
    position: "center",
  },
  "studio-production-day-checklist": {
    src: "/images/resources/learn-workshop-wide.webp",
    alt: "A wide view of a practical production setup inside Studio GQ",
    position: "center",
  },
};

export function getResourceVisual(slug: string): ResourceVisual {
  return (
    resourceVisuals[slug] ?? {
      src: "/images/hero-studio-gq.webp",
      alt: "A production setup inside Studio GQ",
      position: "center",
    }
  );
}
