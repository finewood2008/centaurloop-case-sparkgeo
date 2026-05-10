/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spark: '#F97316',
        'spark-light': '#FFF7ED',
        'spark-bg': '#FAFAF8',
        'spark-text': '#1A1A1A',
        'spark-muted': '#6B7280',
        'spark-border': '#E5E7EB',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
