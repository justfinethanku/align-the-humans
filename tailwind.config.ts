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
}

export default config
