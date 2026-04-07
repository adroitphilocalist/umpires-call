import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          light: 'rgb(var(--color-surface-light) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        success: {
          bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
          text: 'rgb(var(--color-success-text) / <alpha-value>)',
          border: 'rgb(var(--color-success-border) / <alpha-value>)',
        },
        warning: {
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
          text: 'rgb(var(--color-warning-text) / <alpha-value>)',
          border: 'rgb(var(--color-warning-border) / <alpha-value>)',
        },
        danger: {
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
          text: 'rgb(var(--color-danger-text) / <alpha-value>)',
          border: 'rgb(var(--color-danger-border) / <alpha-value>)',
        },
        info: {
          bg: 'rgb(var(--color-info-bg) / <alpha-value>)',
          text: 'rgb(var(--color-info-text) / <alpha-value>)',
          border: 'rgb(var(--color-info-border) / <alpha-value>)',
        },
        card: {
          yellow: 'rgb(var(--color-card-yellow) / <alpha-value>)',
          green: 'rgb(var(--color-card-green) / <alpha-value>)',
          blue: 'rgb(var(--color-card-blue) / <alpha-value>)',
          purple: 'rgb(var(--color-card-purple) / <alpha-value>)',
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