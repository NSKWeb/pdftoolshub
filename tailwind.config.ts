import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial newspaper palette
        paper: "#f3eddd",
        cream: "#fdfaf0",
        ink: "#18140d",
        inksoft: "#403a2c",
        phantom: "#746b56",
        vermilion: "#d93a11",
        cobalt: "#1b3aa3",
        olive: "#5c6b2a",
        line: "#221c12",
        // Legacy aliases so existing classes keep working
        surface: "#f3eddd",
        panel: "#fdfaf0",
        accent: "#d93a11"
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        body: ['"Archivo Variable"', '"Helvetica Neue"', "Helvetica", "sans-serif"]
      },
      boxShadow: {
        offset: "6px 6px 0 0 #18140d",
        "offset-sm": "3px 3px 0 0 #18140d",
        "offset-cream": "6px 6px 0 0 #fdfaf0"
      }
    }
  },
  plugins: []
};

export default config;
