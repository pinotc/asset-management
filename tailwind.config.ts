// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        samsung: {
          DEFAULT: "#1428A0", // Xanh Samsung đặc trưng
          light: "#E5E9FC",   // Xanh nhạt cho background active
          dark: "#0C1966",    // Xanh đậm cho hover
        },
        factory: {
          bg: "#F8F9FA",      // Nền xám cực nhạt chuẩn enterprise
          border: "#E0E4E8",
        }
      },
    },
  },
  plugins: [],
};
export default config;