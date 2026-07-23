import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#080d12",
        foreground: "#e6edf3",
        "bg-primary": "#080b0f",
        "bg-surface": "#0d1117",
        "bg-elevated": "#161b22",
        border: "#21262d",
        "border-hover": "#30363d",
        accent: "#58a6ff",
        fraud: "#f85149",
        safe: "#3fb950",
        warning: "#d29922",
        "text-primary": "#e6edf3",
        "text-muted": "#7d8590",
        "text-subtle": "#484f58",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
