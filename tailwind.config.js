/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(210, 90%, 50%)", // A nice blue
          hover: "hsl(210, 90%, 45%)",
          foreground: "hsl(210, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(210, 10%, 45%)", // A calm gray
          hover: "hsl(210, 10%, 40%)",
          foreground: "hsl(210, 0%, 100%)",
        },
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(210, 50%, 15%)", // Dark text color
        muted: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(210, 10%, 45%)",
        },
        accent: {
          DEFAULT: "hsl(160, 70%, 50%)", // A teal accent
          hover: "hsl(160, 70%, 45%)",
          foreground: "hsl(210, 50%, 15%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 70%, 50%)", // Red for errors/deletions
          hover: "hsl(0, 70%, 45%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        border: "hsl(210, 20%, 88%)",
        input: "hsl(210, 20%, 80%)",
        ring: "hsl(210, 90%, 60%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        container: "0.75rem", // For modal/card containers
      },
      spacing: {
        section: "3rem", // Consistent spacing between sections
      },
      boxShadow: {
        'input': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};
