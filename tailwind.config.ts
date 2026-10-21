import type { Config } from 'tailwindcss';
import path from 'node:path';

export default {
  content: [
    path.resolve(__dirname, 'apps/web/src/**/*.{js,ts,jsx,tsx,mdx}'),
    path.resolve(__dirname, 'packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg)',
        surface: 'var(--surf)',
        foreground: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        brand: 'var(--a)',
        accent: 'var(--b)',
        highlight: 'var(--c)',
        chip: 'var(--chip)',
        'chip-foreground': 'var(--chipt)',
      },
      borderRadius: {
        card: '18px',
      },
      maxWidth: {
        content: '1040px',
      },
    },
  },
  plugins: [],
} satisfies Config;
