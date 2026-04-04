import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a472a',
          light: '#2d5a3d',
          dark: '#0f2a1b',
        },
        accent: {
          DEFAULT: '#d4af37',
          light: '#e5c556',
          dark: '#b8962e',
        },
        background: '#0a0f0d',
        surface: {
          DEFAULT: '#141c16',
          light: '#1e2a22',
        },
        text: {
          primary: '#f5f5dc',
          secondary: '#a8b5a0',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;