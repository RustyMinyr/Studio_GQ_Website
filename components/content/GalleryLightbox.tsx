"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  size?: "portrait" | "landscape" | "wide";
  position?: string;
};

export function GalleryLightbox({ items }: { items: GalleryItem[] }) {
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = activeIndex !== null;

  const close = useCallback(() => {
    setActiveIndex(null);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null) return null;
        return (current + direction + items.length) % items.length;
      });
    },
    [items.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close, step]);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-12 md:gap-x-5 md:gap-y-14">
        {items.map((item, index) => {
          const gridClass =
            item.size === "wide"
              ? "col-span-2 md:col-span-8"
              : item.size === "landscape"
                ? "col-span-2 md:col-span-7"
                : "col-span-1 md:col-span-5";

          return (
            <figure className={gridClass} key={`${item.src}-${index}`}>
              <button
                aria-label={`Open image ${index + 1} of ${items.length}: ${item.caption}`}
                className="group block w-full cursor-zoom-in overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-[#050505] focus-visible:ring-offset-4"
                onClick={(event) => {
                  previousFocusRef.current = event.currentTarget;
                  setActiveIndex(index);
                }}
                type="button"
              >
                <Image
                  unoptimized
                  alt={item.alt}
                  className="h-auto w-full transition duration-500 ease-out group-hover:scale-[1.015] group-hover:brightness-95 motion-reduce:transition-none"
                  height={item.height}
                  loading="lazy"
                  sizes={item.size === "wide" ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 42vw, 50vw"}
                  src={item.src}
                  style={{ objectPosition: item.position }}
                  width={item.width}
                />
              </button>
              <figcaption className="mt-3 flex justify-between gap-4 text-xs uppercase tracking-[0.16em] text-[#565656]">
                <span>{item.caption}</span>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {activeIndex !== null ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-[100] flex bg-[#050505]/[0.98] text-white"
          ref={dialogRef}
          role="dialog"
        >
          <h2 className="sr-only" id={titleId}>
            Gallery image viewer
          </h2>
          <button
            aria-label="Close gallery image viewer"
            className="absolute right-4 top-4 z-10 flex min-h-11 min-w-11 items-center justify-center border border-[#565656] text-2xl outline-none transition-colors hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-white md:right-8 md:top-8"
            onClick={close}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
          <button
            aria-label="Show previous image"
            className="absolute bottom-5 left-4 z-10 flex min-h-11 min-w-11 items-center justify-center border border-[#565656] text-xl outline-none transition-colors hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-white md:bottom-auto md:left-8 md:top-1/2 md:-translate-y-1/2"
            onClick={() => step(-1)}
            type="button"
          >
            <span aria-hidden="true">←</span>
          </button>
          <figure className="m-auto flex h-full w-full flex-col items-center justify-center px-5 py-20 md:px-28">
            <div className="relative h-[70vh] w-full">
              <Image
                unoptimized
                alt={items[activeIndex].alt}
                className="object-contain"
                fill
                sizes="100vw"
                src={items[activeIndex].src}
                style={{ objectFit: "contain" }}
              />
            </div>
            <figcaption className="mt-4 text-center text-sm uppercase tracking-[0.16em] text-[#a7a7a3]">
              {items[activeIndex].caption} · {activeIndex + 1} / {items.length}
            </figcaption>
          </figure>
          <button
            aria-label="Show next image"
            className="absolute bottom-5 right-4 z-10 flex min-h-11 min-w-11 items-center justify-center border border-[#565656] text-xl outline-none transition-colors hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-white md:bottom-auto md:right-8 md:top-1/2 md:-translate-y-1/2"
            onClick={() => step(1)}
            type="button"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
