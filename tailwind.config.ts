import type { Config } from "tailwindcss";

/**
 * Every colour resolves through a CSS variable so a client store can rebrand
 * from configuration alone. The fallbacks match src/app/globals.css, which is
 * the canonical definition — see the token rationale there.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/theme/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          // Text
          ink: "var(--brand-ink, #282c3f)",
          "muted-ink": "var(--brand-muted-ink, #696b79)",
          "faint-ink": "var(--brand-faint-ink, #94969f)",

          // Brand
          DEFAULT: "var(--brand-primary, #f5325b)",
          primary: "var(--brand-primary, #f5325b)",
          "primary-hover": "var(--brand-primary-hover, #d81e49)",
          secondary: "var(--brand-secondary, #282c3f)",
          accent: "var(--brand-accent, #f5325b)",

          // Semantic. Ratings green, discounts orange, scarcity red — the
          // conventions shoppers read pre-attentively.
          rating: "var(--brand-rating, #14958f)",
          success: "var(--brand-success, #03a685)",
          discount: "var(--brand-discount, #ff690f)",
          urgent: "var(--brand-urgent, #ff5a5a)",
          danger: "var(--brand-danger, #e5343d)",

          // Surfaces
          surface: "var(--brand-surface, #ffffff)",
          subtle: "var(--brand-subtle, #f5f5f6)",
          muted: "var(--brand-muted, #fafafb)",
          border: "var(--brand-border, #eaeaec)",
          "border-strong": "var(--brand-border-strong, #d4d5d9)",

          // Tint ramp, kept for components that expect numeric steps.
          50: "var(--brand-50, #fff1f4)",
          100: "var(--brand-100, #ffe0e7)",
          200: "var(--brand-200, #ffc6d3)",
          300: "var(--brand-300, #ff9db3)",
          400: "var(--brand-400, #fb6a8d)",
          500: "var(--brand-500, #f5325b)",
          600: "var(--brand-600, #e11d48)",
          700: "var(--brand-700, #be123c)",
          800: "var(--brand-800, #9f1239)",
          900: "var(--brand-900, #881337)",
          950: "var(--brand-950, #4c0519)",
        },
      },
      borderRadius: {
        // Squarer than the SaaS default. Marketplace UI is not pill-shaped, and
        // over-rounding every surface is a large part of "looks generic".
        brand: "var(--brand-radius, 4px)",
        "brand-sm": "var(--brand-radius-sm, 2px)",
        "brand-lg": "var(--brand-radius-lg, 8px)",
        "brand-xl": "var(--brand-radius-xl, 12px)",
        "brand-full": "var(--brand-radius-full, 9999px)",
      },
      fontFamily: {
        heading: ["var(--font-heading, 'Figtree', 'Inter', sans-serif)"],
        body: ["var(--font-body, 'Figtree', 'Inter', sans-serif)"],
      },
      fontSize: {
        // Dense marketplace scale: product metadata lives between 11 and 14px.
        "2xs": ["10px", { lineHeight: "14px" }],
      },
      boxShadow: {
        // Shallow and tight. Big soft shadows read as cards floating in space,
        // which fights the dense grid a catalog needs.
        subtle: "0 1px 2px 0 rgba(40, 44, 63, 0.04)",
        card: "0 1px 4px 0 rgba(40, 44, 63, 0.08)",
        float: "0 4px 12px -2px rgba(40, 44, 63, 0.12)",
        elevated: "0 8px 24px -4px rgba(40, 44, 63, 0.16)",
        // The upward shadow used by sticky bottom bars.
        "bar-up": "0 -4px 16px rgba(40, 44, 63, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
