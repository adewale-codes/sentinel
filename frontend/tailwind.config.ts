import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#080d12",
        foreground: "#e6edf3",
      },
    },
  },
  plugins: [],
};

export default config;
