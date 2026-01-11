/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '6px',
        'xl': '6px',
        '2xl': '6px',
        '3xl': '6px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
