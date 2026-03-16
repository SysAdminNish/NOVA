import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#050d1a',
        panel: '#0a1628',
        card: '#0d1e35',
        card2: '#0f2040',
        cyan: '#00c8ff',
        green: '#00ffa3',
        orange: '#ff8c42',
        'voip-red': '#ff4d6d',
        purple: '#9b5de5',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
