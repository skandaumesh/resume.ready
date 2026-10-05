// ─────────────────────────────────────────────────────────────────────────
// fetch() for the AI routes, used by the browser. When every free AI model
// is busy (e.g. a whole class clicks Generate at once), the route answers
// 503 { busy, retryAfter } instead of failing. This waits that long and tries
// again, reporting a countdown so the page can show "you're in line" rather
// than an error. Random jitter on each wait spreads a classroom's retries out
// so they don't all hit the providers in the same second.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Stop waiting after this long and show the busy error instead. Free tiers
 * serve roughly 40–60 AI calls a minute in total, so even 500 students
 * clicking at once all get through in ~12 minutes (simulated) — giving up
 * sooner would only send them to the back of the line.
 */
const MAX_WAIT_MS = 15 * 60 * 1000;

/**
 * Like fetch(), but retries while the AI is busy. `onWait` receives the
 * seconds until the next try (0 = trying now), then null once it's settled.
 */
export async function fetchAi(
  url: string,
  init: RequestInit,
  onWait?: (secondsLeft: number | null) => void,
): Promise<Response> {
  const started = Date.now();
  try {
    for (;;) {
      const res = await fetch(url, init);
      if (res.status !== 503) return res;
      const body = await res.clone().json().catch(() => null);
      if (!body?.busy || Date.now() - started > MAX_WAIT_MS) return res;

      const base = Math.max(Number(body.retryAfter) || 10, 3);
      let left = Math.round(base * (0.8 + Math.random() * 0.8));
      while (left > 0) {
        onWait?.(left);
        await new Promise((r) => setTimeout(r, 1000));
        left--;
      }
      onWait?.(0);
    }
  } finally {
    onWait?.(null);
  }
}
