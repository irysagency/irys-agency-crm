// NOTE: This project uses Tailwind v4. tailwind.config.ts acts as a compatibility
// layer for IDE tooling. The canonical source of design tokens is the @theme block
// in src/app/globals.css. Both files MUST be kept in sync when tokens are added/modified.
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          sidebar: '#0F0F1A',
          card: '#13131F',
        },
        accent: {
          violet: '#7F77DD',
          success: '#1D9E75',
          warning: '#EF9F27',
          danger: '#E24B4A',
        },
        text: {
          primary: '#F1F1F1',
          secondary: '#888780',
        },
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.06)',
        DEFAULT: 'rgba(255,255,255,0.10)',
      },
      borderRadius: {
        card: '12px',
        badge: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
