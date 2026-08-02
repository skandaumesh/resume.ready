"use client";

import { useEffect, useRef, useState } from "react";

export const PREVIEW_PAGE_W = 794;
export const PREVIEW_PAGE_H = 1123;

// Renders one template preview, measuring its own box so the scaled page
// exactly fills the container width — a fixed scale value only matches one
// breakpoint's column width and clips the page on every other breakpoint.
export default function TemplatePreviewCard({
  templateName,
  html,
}: {
  templateName: string;
  html: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PREVIEW_PAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-white">
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: PREVIEW_PAGE_W, height: PREVIEW_PAGE_H, transform: `scale(${scale})` }}
      >
        <iframe
          srcDoc={html}
          title={`${templateName} template preview`}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none h-full w-full border-none"
        />
      </div>

      {/* hover overlay — frosted blur fading in, like the reference */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 opacity-0 backdrop-blur-sm transition-opacity duration-500 ease-in-out group-hover:opacity-100">
        <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-content-strong shadow-subtle">
          Use this template
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}
