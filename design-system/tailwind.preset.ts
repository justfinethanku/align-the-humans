import type { Config } from 'tailwindcss';

const colorSteps = ['50','100','200','300','400','500','600','700','800','900','950'] as const;
const withOpacityValue = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const createScale = (token: string) => {
  const scale: Record<string, string> = {};
  for (const step of colorSteps) {
    scale[step] = withOpacityValue(`--${token}-${step}`);
  }
  scale.DEFAULT = scale['500'];
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
        primary: createScale('color-primary'),
        accent: createScale('color-accent'),
        info: createScale('color-info'),
        success: createScale('color-success'),
        warning: createScale('color-warning'),
        danger: createScale('color-danger'),
        background: {
          light: 'rgb(var(--color-background-light) / <alpha-value>)',
          dark: 'rgb(var(--color-background-dark) / <alpha-value>)',
          muted: 'rgb(var(--color-background-muted) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface-default) / <alpha-value>)',
          dark: 'rgb(var(--color-surface-dark) / <alpha-value>)',
          contrast: 'rgb(var(--color-surface-contrast) / <alpha-value>)',
        },
        border: {
          subtle: 'rgba(var(--color-border-subtle), 0.5)',
          strong: 'rgba(var(--color-border-strong), 0.7)',
        },
        text: {
          DEFAULT: 'rgb(var(--color-text-primary) / 1)',
          muted: 'rgb(var(--color-text-muted) / 1)',
          inverted: 'rgb(var(--color-text-inverted) / 1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-sans, Inter)', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-lg': '0 0 40px rgba(16, 185, 129, 0.4)',
        soft: '0 4px 6px -1px rgb(15 23 42 / 0.15), 0 2px 4px -2px rgb(15 23 42 / 0.12)',
        'soft-md': '0 10px 15px -3px rgb(15 23 42 / 0.18), 0 4px 6px -4px rgb(15 23 42 / 0.1)',
        'soft-lg': '0 20px 30px -10px rgb(15 23 42 / 0.25)',
        card: '0 25px 50px -12px rgb(15 23 42 / 0.35)',
      },
      backgroundImage: {
        'grid-dots': 'radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)',
        'radial-spotlight': 'radial-gradient(circle at top, rgba(59,130,246,0.35), transparent 55%)',
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
