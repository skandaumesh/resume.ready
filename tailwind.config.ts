import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Greyscale + one blue. Colour appears only where it earns attention:
        // the primary action, and the gradient reserved for social proof.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
        },
        // White surfaces — separation by the hairline outline, not tint.
        canvas: {
          DEFAULT: "#ffffff",
          deep: "#f6f6f4",
        },
        hairline: {
          DEFAULT: "#eaeae7",
          strong: "#e5e5e2",
        },
        content: {
          primary: "#0a0a0a",
          strong: "#171717",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        // Secondary accents — used sparingly (glow/ring accents), never as
        // large fills. The primary action stays brand-600 blue.
        "accent-purple": "var(--accent-purple)",
        success: "var(--success)",
        danger: "var(--danger)",
      },
      borderRadius: {
        card: "12px",
        panel: "16px",
        prompt: "24px",
      },
      boxShadow: {
        // Depth comes from surface lightness, not drop shadow.
        subtle: "0 1px 3px rgba(0,0,0,0.04)",
        lifted: "0 4px 16px -4px rgba(0,0,0,0.08)",
        // Named aliases for the design-token shadows in globals.css.
        "elevation-sm": "var(--shadow-sm)",
        "elevation-md": "var(--shadow-md)",
        "elevation-lg": "var(--shadow-lg)",
        control: "var(--shadow-control)",
      },
      // Additive fluid tokens — opt-in via `p-fluid-md`, `text-fluid-hero`,
      // etc. The existing static scale (p-4, text-sm, ...) is untouched so
      // pixel-critical layouts (resume-preview iframes) keep working.
      spacing: {
        "fluid-2xs": "var(--space-2xs)",
        "fluid-xs": "var(--space-xs)",
        "fluid-sm": "var(--space-sm)",
        "fluid-md": "var(--space-md)",
        "fluid-lg": "var(--space-lg)",
        "fluid-xl": "var(--space-xl)",
        "fluid-2xl": "var(--space-2xl)",
        "fluid-3xl": "var(--space-3xl)",
      },
      fontSize: {
        "fluid-2xs": "var(--text-fluid-2xs)",
        "fluid-xs": "var(--text-fluid-xs)",
        "fluid-sm": "var(--text-fluid-sm)",
        "fluid-base": "var(--text-fluid-base)",
        "fluid-lg": "var(--text-fluid-lg)",
        "fluid-xl": "var(--text-fluid-xl)",
        "fluid-2xl": "var(--text-fluid-2xl)",
        "fluid-3xl": "var(--text-fluid-3xl)",
        "fluid-4xl": "var(--text-fluid-4xl)",
        "fluid-5xl": "var(--text-fluid-5xl)",
        "fluid-hero": "var(--text-fluid-hero)",
      },
      transitionTimingFunction: {
        signature: "cubic-bezier(0.76, 0, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
