import type { Config } from 'tailwindcss'
import designSystemPreset from './design-system/tailwind.preset'

const config: Config = {
  presets: [designSystemPreset],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './design-system/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Marketing site ("registration" design): two ink plates, one per partner.
      // Plate A + plate B multiplied together print as ink — that's "in register".
      colors: {
        paper: { DEFAULT: '#F3F4F0', deep: '#E7E9E2' },
        ink: { DEFAULT: '#1A1D2E', soft: '#4A4F60' },
        rule: '#D3D6CD',
        plate: {
          a: 'var(--plate-a)',
          b: 'var(--plate-b)',
          'b-text': '#C4331A',
        },
      },
    },
  },
}

export default config
