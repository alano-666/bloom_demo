export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        panel: "var(--panel)",
        line: "var(--line)",
        text: "var(--text)",
        muted: "var(--muted)",
        primary: {
          50: "#F4F0FF",
          100: "#E6DDFF",
          200: "#D4C4FF",
          300: "#BB9BFF",
          400: "#9E74FF",
          500: "#7C4DFF",
          600: "#6F3FEA",
          700: "#5C32C5",
        },
      },
      boxShadow: {
        card: "0 18px 48px rgba(93, 60, 196, 0.08)",
        soft: "0 10px 24px rgba(124, 77, 255, 0.12)",
      },
      borderRadius: {
        panel: "28px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
