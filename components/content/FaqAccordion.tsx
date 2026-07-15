"use client";

import { useId, useState } from "react";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const accordionId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border-t border-[#565656]">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const triggerId = `${accordionId}-trigger-${index}`;
        const panelId = `${accordionId}-panel-${index}`;

        return (
          <div className="border-b border-[#565656]" key={item.question}>
            <h3>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left text-lg font-normal tracking-[-0.02em] outline-none transition-colors hover:text-[#565656] focus-visible:ring-2 focus-visible:ring-[#050505] focus-visible:ring-offset-4 md:min-h-20 md:text-xl"
                id={triggerId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && isOpen) {
                    event.preventDefault();
                    setOpenIndex(null);
                  }
                }}
                type="button"
              >
                <span>{item.question}</span>
                <span aria-hidden="true" className="shrink-0 text-2xl font-light">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              aria-labelledby={triggerId}
              className={isOpen ? "block" : "hidden"}
              id={panelId}
              role="region"
            >
              <p className="max-w-3xl pb-7 pr-10 leading-7 text-[#565656] md:pb-9 md:text-lg">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
