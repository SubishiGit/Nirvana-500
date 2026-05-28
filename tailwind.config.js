/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      colors: {
        'brand-cyan': 'rgba(0, 255, 255, 0.6)',
        'brand-yellow': 'rgba(255, 255, 0, 0.6)',
        'brand-red': 'rgba(255, 0, 0, 0.6)',
        'brand-purple': 'rgba(168, 85, 247, 0.7)',
        'brand-blue': 'rgba(59, 130, 246, 0.7)',
      },
    },
  },
  plugins: [],
}
