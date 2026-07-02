import type { Config } from 'tailwindcss';

const colorSteps = ['50','100','200','300','400','500','600','700','800','900','950'] as const;
const withOpacityValue = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;
const hslValue = (variable: string) => `hsl(var(${variable}))`;

const createScale = (token: string) => {
  const scale: Record<string, string> = {};
  for (const step of colorSteps) {
    scale[step] = withOpacityValue(`--${token}-${step}`);
  }
  return scale;
};

const preset = {
  darkMode: 'class',
  content: [],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '1.5rem',
        lg: '3rem',
        '2xl': '5rem',
      },
    },
    extend: {
      colors: {
        border: {
          DEFAULT: hslValue('--border'),
          subtle: 'rgba(var(--color-border-subtle), 0.5)',
          strong: 'rgba(var(--color-border-strong), 0.7)',
        },
        input: hslValue('--input'),
        ring: hslValue('--ring'),
        background: {
          DEFAULT: hslValue('--background'),
          light: 'rgb(var(--color-background-light) / <alpha-value>)',
          dark: 'rgb(var(--color-background-dark) / <alpha-value>)',
          muted: 'rgb(var(--color-background-muted) / <alpha-value>)',
        },
        foreground: hslValue('--foreground'),
        primary: {
          ...createScale('color-primary'),
          DEFAULT: hslValue('--primary'),
          foreground: hslValue('--primary-foreground'),
        },
        secondary: {
          DEFAULT: hslValue('--secondary'),
          foreground: hslValue('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: hslValue('--destructive'),
          foreground: hslValue('--destructive-foreground'),
        },
        muted: {
          DEFAULT: hslValue('--muted'),
          foreground: hslValue('--muted-foreground'),
        },
        accent: {
          ...createScale('color-accent'),
          DEFAULT: hslValue('--accent'),
          foreground: hslValue('--accent-foreground'),
        },
        popover: {
          DEFAULT: hslValue('--popover'),
          foreground: hslValue('--popover-foreground'),
        },
        card: {
          DEFAULT: hslValue('--card'),
          foreground: hslValue('--card-foreground'),
        },
        info: createScale('color-info'),
        success: createScale('color-success'),
        warning: createScale('color-warning'),
        danger: createScale('color-danger'),
        surface: {
          DEFAULT: 'rgb(var(--color-surface-default) / <alpha-value>)',
          dark: 'rgb(var(--color-surface-dark) / <alpha-value>)',
          contrast: 'rgb(var(--color-surface-contrast) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--color-text-primary) / 1)',
          muted: 'rgb(var(--color-text-muted) / 1)',
          inverted: 'rgb(var(--color-text-inverted) / 1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 20px rgb(var(--color-primary-500) / 0.3)',
        'glow-lg': '0 0 40px rgb(var(--color-primary-500) / 0.4)',
        soft: '0 4px 6px -1px rgb(15 23 42 / 0.15), 0 2px 4px -2px rgb(15 23 42 / 0.12)',
        'soft-md': '0 10px 15px -3px rgb(15 23 42 / 0.18), 0 4px 6px -4px rgb(15 23 42 / 0.1)',
        'soft-lg': '0 20px 30px -10px rgb(15 23 42 / 0.25)',
        card: '0 25px 50px -12px rgb(15 23 42 / 0.35)',
      },
      backgroundImage: {
        'grid-dots': 'radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)',
        'radial-spotlight': 'radial-gradient(circle at top, rgb(var(--color-accent-500) / 0.35), transparent 55%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.75' },
          '70%': { transform: 'scale(1.2)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.5s infinite',
        'fade-up': 'fade-up 700ms ease forwards',
      },
      ringWidth: {
        3: '3px',
      },
      opacity: {
        15: '0.15',
        85: '0.85',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default preset;