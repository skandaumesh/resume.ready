"use client";

import { useEffect, useRef, useState } from "react";

// A4 page size in px at 96dpi — matches the @page size in resumeHtml.ts, so
// a page break here lands exactly where the browser's "Save as PDF" cuts it.
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

// Scaled A4 preview — used by the resume editor's live preview panel/mobile
// overlay and the standalone preview page, each with its own container width
// to scale against. Renders one page-sized box per A4 page the content
// actually spans (with a real gap between them, like Google Docs/Word),
// instead of one continuous sheet that hides where the PDF would break.
export default function ScaledResumePreview({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [docHeight, setDocHeight] = useState(PAGE_HEIGHT);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setScale(width / PAGE_WIDTH);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Measure the rendered resume's real height so we know how many A4 pages
  // it actually spans, instead of clipping to a fixed single-page box.
  function handleLoad(e: { currentTarget: HTMLIFrameElement }) {
    const doc = e.currentTarget.contentDocument;
    if (doc) {
      const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || PAGE_HEIGHT;
      setDocHeight(Math.max(h, 200));
    }
  }

  const numPages = Math.max(1, Math.ceil(docHeight / PAGE_HEIGHT));

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl"
    >
      {/* key forces a clean remount (not an in-place patch) whenever the
          measured height changes the page count — e.g. the first render
          guesses 1 page, then jumps to the real count once the iframe
          reports its actual height, and patching that transition in place
          risked a stale/half-updated frame instead of a clean swap. */}
      <div key={numPages} className="mx-auto flex flex-col gap-5" style={{ width: PAGE_WIDTH * scale }}>
        {Array.from({ length: numPages }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-white shadow-2xl"
            style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
          >
            <div
              className="absolute left-0 origin-top-left"
              style={{ top: -i * PAGE_HEIGHT * scale, width: PAGE_WIDTH * scale, height: docHeight * scale }}
            >
              <div className="origin-top-left" style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}>
                <iframe
                  title={`Resume preview, page ${i + 1}`}
                  srcDoc={html}
                  onLoad={i === 0 ? handleLoad : undefined}
                  scrolling="no"
                  style={{ width: PAGE_WIDTH, height: docHeight, border: 0, display: "block" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
