import type { Config } from "tailwindcss";

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
          50: "var(--brand-50, #f0fdf4)",
          100: "var(--brand-100, #dcfce7)",
          200: "var(--brand-200, #bbf7d0)",
          300: "var(--brand-300, #86efac)",
          400: "var(--brand-400, #4ade80)",
          500: "var(--brand-500, #10b981)",
          600: "var(--brand-600, #059669)",
          700: "var(--brand-700, #047857)",
          800: "var(--brand-800, #065f46)",
          900: "var(--brand-900, #064e3b)",
          950: "var(--brand-950, #022c22)",
          DEFAULT: "var(--brand-primary, #0f172a)",
          primary: "var(--brand-primary, #0f172a)",
          secondary: "var(--brand-secondary, #334155)",
          accent: "var(--brand-accent, #6366f1)",
          surface: "var(--brand-surface, #ffffff)",
          muted: "var(--brand-muted, #f8fafc)",
          border: "var(--brand-border, #e2e8f0)",
        },
      },
      borderRadius: {
        brand: "var(--brand-radius, 0.5rem)",
        "brand-sm": "var(--brand-radius-sm, 0.25rem)",
        "brand-lg": "var(--brand-radius-lg, 0.75rem)",
        "brand-xl": "var(--brand-radius-xl, 1rem)",
        "brand-full": "var(--brand-radius-full, 9999px)",
      },
      fontFamily: {
        heading: ["var(--font-heading, 'Outfit', 'Inter', sans-serif)"],
        body: ["var(--font-body, 'Inter', sans-serif)"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        float: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        elevated: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
