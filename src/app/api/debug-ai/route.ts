import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Temporary diagnostic endpoint — shows which AI providers work on this deployment.
// DELETE THIS after debugging.
export async function GET() {
  const results: Record<string, unknown> = {};

  // Check which env vars are set (show first/last 4 chars only)
  const mask = (v: string | undefined) =>
    v ? `${v.slice(0, 4)}...${v.slice(-4)} (len=${v.length})` : "NOT SET";

  results.env = {
    GEMINI_API_KEY: mask(process.env.GEMINI_API_KEY),
    GEMINI_MODEL: process.env.GEMINI_MODEL || "(default)",
    GROQ_API_KEY: mask(process.env.GROQ_API_KEY),
    CEREBRAS_API_KEY: mask(process.env.CEREBRAS_API_KEY),
    OPENROUTER_API_KEY: mask(process.env.OPENROUTER_API_KEY),
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "(default)",
  };

  // Test Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = (process.env.GEMINI_MODEL || "gemini-3.8-flash").split(",")[0].trim();
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${geminiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Say OK" }],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const text = await res.text();
      results.gemini = { status: res.status, model, body: text.slice(0, 300) };
    } catch (e) {
      results.gemini = { error: String(e) };
    }
  } else {
    results.gemini = "SKIPPED (no key)";
  }

  // Test OpenRouter
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      const model = (process.env.OPENROUTER_MODEL || "qwen/qwen3.8-27b:free").split(",")[0].trim();
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Say OK" }],
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      results.openrouter = { status: res.status, model, body: text.slice(0, 300) };
    } catch (e) {
      results.openrouter = { error: String(e) };
    }
  } else {
    results.openrouter = "SKIPPED (no key)";
  }

  // Test Cerebras
  const cbKey = process.env.CEREBRAS_API_KEY;
  if (cbKey) {
    try {
      const model = (process.env.CEREBRAS_MODEL || "llama-3.3-70b").split(",")[0].trim();
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cbKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Say OK" }],
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      results.cerebras = { status: res.status, model, body: text.slice(0, 300) };
    } catch (e) {
      results.cerebras = { error: String(e) };
    }
  } else {
    results.cerebras = "SKIPPED (no key)";
  }

  return NextResponse.json(results, { status: 200 });
}
