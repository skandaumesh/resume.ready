// ─────────────────────────────────────────────────────────────────────────
// Turns a rendered resume (renderResumeHtml) into a standalone print page.
// The PDF is made by the student's own browser — "Save as PDF" in the
// desktop print dialog, the Android print screen, or the iOS print sheet —
// so the server never launches a headless browser, however many students
// download at once.
//
// On screen: a small toolbar over the A4 sheet, zoomed to fit the window so
// phones see the whole page. When printing: the toolbar is hidden and the
// sheet prints at full A4 size, exactly as the preview shows it.
// ─────────────────────────────────────────────────────────────────────────

import { esc } from "@/lib/resumeHtml";

// A4 width in CSS px at 96dpi — matches the @page size in resumeHtml.ts.
const SHEET_WIDTH = 794;

// Everything here is prefixed `rr-` and avoids h1/h2/section/ul so the
// resume template's own CSS (which styles those elements) can't leak in.
const PRINT_CSS = `
  /* Keep template colors (sidebars, header bands) in the PDF even when the
     print dialog's "Background graphics" option is off. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  @media screen {
    html, body { background: #e7e5e4; }
    .rr-sheet {
      width: ${SHEET_WIDTH}px; margin: 16px auto 32px; background: #fff;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      zoom: var(--rr-fit, 1);
    }
  }
  @media print {
    .rr-bar { display: none !important; }
  }

  .rr-bar {
    position: sticky; top: 0; z-index: 10;
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px;
    padding: 10px 16px; background: #fff; border-bottom: 1px solid #d6d3d1;
    font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #44403c;
  }
  .rr-back { color: #57534e; text-decoration: none; white-space: nowrap; }
  .rr-back:hover { color: #1c1917; }
  .rr-hint { flex: 1; min-width: 0; }
  .rr-save {
    border: 0; border-radius: 11px; padding: 10px 18px; cursor: pointer;
    background: #2563eb; color: #fff; font-family: inherit;
    font-size: 14px; font-weight: 600; line-height: 1.2; white-space: nowrap;
  }
  .rr-save:hover { background: #1d4ed8; }
  .rr-fallback {
    flex-basis: 100%; padding: 8px 12px; border-radius: 8px;
    background: #fef3c7; color: #78350f;
  }
  /* Phones: Back + button on the first row, the instructions below. */
  @media (max-width: 640px) {
    .rr-back { order: 1; }
    .rr-save { order: 2; margin-left: auto; }
    .rr-hint { order: 3; flex-basis: 100%; font-size: 13px; }
    .rr-fallback { order: 4; font-size: 13px; }
  }
`;

// Plain ES5 so it runs in any phone browser, including older in-app ones.
const PRINT_JS = `
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('rr-save');
  var hint = document.getElementById('rr-hint');
  var fallback = document.getElementById('rr-fallback');
  var back = document.getElementById('rr-back');

  // Zoom the A4 sheet down to the window width (phones), never up.
  function fit() {
    var fitScale = Math.min(1, (root.clientWidth - 24) / ${SHEET_WIDTH});
    root.style.setProperty('--rr-fit', String(Math.max(fitScale, 0.2)));
  }
  fit();
  window.addEventListener('resize', fit);

  // Each platform hides "Save as PDF" in a different place.
  var ua = navigator.userAgent;
  var ios = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    hint.textContent = 'Tap Save as PDF, then tap the Share button at the top of the print screen and choose \\u201cSave to Files\\u201d.';
  } else if (/Android/i.test(ua)) {
    hint.textContent = 'Tap Save as PDF, pick \\u201cSave as PDF\\u201d as the printer at the top, then tap the PDF button.';
  }

  // In-app browsers (WhatsApp, Instagram, LinkedIn…) silently ignore
  // window.print(). If no print screen shows up, say how to get out.
  var printing = false;
  window.addEventListener('beforeprint', function () { printing = true; });
  if (window.matchMedia) {
    var mq = window.matchMedia('print');
    var onChange = function (e) { if (e.matches) printing = true; };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  btn.addEventListener('click', function () {
    printing = false;
    fallback.hidden = true;
    window.print();
    setTimeout(function () { if (!printing) fallback.hidden = false; }, 1500);
  });

  // Return to wherever the student came from (editor or preview).
  back.addEventListener('click', function (e) {
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin) {
        e.preventDefault();
        history.back();
      }
    } catch (err) {}
  });

  // Desktop: open the print dialog straight away — that IS the download.
  // Touch devices get the button and the instructions above it first.
  window.addEventListener('load', function () {
    if (!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) {
      setTimeout(function () { window.print(); }, 250);
    }
  });
})();
`;

export interface PrintPageOptions {
  /** Becomes the page <title>, which browsers use as the PDF's file name. */
  title: string;
  /** Where "← Back" goes when there is no in-app page to go back to. */
  backHref: string;
}

/** Wrap a full resume document (from renderResumeHtml) as a print page. */
export function renderPrintPage(resumeHtml: string, opts: PrintPageOptions): string {
  const fileName = opts.title.trim() || "Resume";
  const bar = `<div class="rr-bar">
  <a class="rr-back" id="rr-back" href="${esc(opts.backHref).replace(/"/g, "&quot;")}">&larr; Back</a>
  <div class="rr-hint" id="rr-hint">In the print window, set Destination to &ldquo;Save as PDF&rdquo;, then click Save.</div>
  <button type="button" class="rr-save" id="rr-save">Save as PDF</button>
  <div class="rr-fallback" id="rr-fallback" hidden>Didn&rsquo;t see a print screen? This app&rsquo;s built-in browser can&rsquo;t save PDFs. Open this page in Chrome or Safari and tap Save as PDF again.</div>
</div>
<div class="rr-sheet">`;

  return resumeHtml
    .replace("</head>", `<title>${esc(fileName)}</title>\n<style>${PRINT_CSS}</style>\n</head>`)
    .replace("<body>", `<body>\n${bar}`)
    .replace("</body>", `</div>\n<script>${PRINT_JS}</script>\n</body>`);
}
