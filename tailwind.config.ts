
import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: "hsl(207 90% 97%)",
          100: "hsl(207 85% 92%)",
          200: "hsl(207 77% 84%)",
          300: "hsl(207 71% 72%)",
          400: "hsl(207 67% 58%)",
          500: "hsl(207 73% 43%)",
          600: "hsl(207 76% 36%)",
          700: "hsl(207 77% 29%)",
          800: "hsl(207 78% 23%)",
          900: "hsl(207 79% 18%)",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          light: "hsl(262 83% 94%)",
          DEFAULT: "hsl(var(--accent))",
          dark: "hsl(262 83% 48%)",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          light: "hsl(142 76% 92%)",
          DEFAULT: "hsl(142 71% 45%)",
          dark: "hsl(142 76% 36%)",
        },
        warning: {
          light: "hsl(38 92% 90%)",
          DEFAULT: "hsl(38 92% 50%)",
          dark: "hsl(38 92% 36%)",
        },
        danger: {
          light: "hsl(0 93% 94%)",
          DEFAULT: "hsl(0 84% 60%)",
          dark: "hsl(0 73% 41%)",
        },
        gray: {
          50: "hsl(210 40% 98%)",
          100: "hsl(214 32% 94%)",
          200: "hsl(213 27% 84%)",
          300: "hsl(211 23% 69%)",
          400: "hsl(211 20% 53%)",
          500: "hsl(211 24% 43%)",
          600: "hsl(211 30% 33%)",
          700: "hsl(211 34% 23%)",
          800: "hsl(211 40% 16%)",
          900: "hsl(211 44% 11%)",
        },
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
        xs: '4px'
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "slide-in-up": "slide-in-up 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "shake": "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
