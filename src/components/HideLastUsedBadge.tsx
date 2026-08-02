"use client";

import { useEffect } from "react";

// Clerk's "Last used" pill on the Google button only appears once this
// browser has a prior sign-in cookie for that provider, so it can't be
// reproduced in a fresh session to find its class name. Appearance overrides
// (`badge: "!hidden"`) and CSS class guesses haven't caught it, so instead
// we hide it by matching the rendered text directly.
export default function HideLastUsedBadge() {
  useEffect(() => {
    const hide = () => {
      document.querySelectorAll<HTMLElement>("span, div, p").forEach((el) => {
        if (el.children.length === 0 && el.textContent?.trim() === "Last used") {
          el.style.display = "none";
        }
      });
    };
    hide();
    const observer = new MutationObserver(hide);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
