# theme-visual-polish scout

## Current state

- `app/layout.tsx` already has `disableTransitionOnChange` on the root `ThemeProvider`; do not spend implementation time re-adding it.
- `ThemeProvider` still uses the next-themes default storage key, so old `localStorage.theme = "dark"` values still beat `defaultTheme="light"`.
- Both root fonts use `display: 'optional'`: Inter is the body/UI font, and Manrope is the display/heading font through `design-system/tailwind.preset.ts`.
- `ThemeToggle` reserves button dimensions before mount, but it renders no icon until hydration completes.
- `app/loading.tsx` is a full-screen blank background. Several route loading files also replace the screen with animated spinners or pulsing skeletons.
- `app/globals.css` only imports the design-system stylesheet. The design-system CSS is light-first at `:root` and `body`, dark only under `.dark`, and does not contain another theme bootstrap race. Remaining CSS-side flash risk is from decorative/loading animation utilities and hardcoded loading colors, not from the token definitions themselves.

## Recommendations

### [P0] Move next-themes to a light-era storage key

Files:

- `app/layout.tsx`

Plan:

- Use a new next-themes storage key instead of a client-side migration. A `useEffect` migration would run after the next-themes bootstrap script has already read `localStorage.theme`, so it can still paint dark first.
- Add `storageKey="align-the-humans-theme-v2"` directly to the existing provider in `app/layout.tsx`, keeping the current light default and transition suppression:

```tsx
<ThemeProvider
  attribute="class"
  storageKey="align-the-humans-theme-v2"
  defaultTheme="light"
  enableSystem={false}
  disableTransitionOnChange
>
```

- Do not read, rewrite, or remove the legacy `theme` key in app code. Leaving it orphaned is harmless and avoids an ordering fight with the next-themes inline script.
- Expected behavior: legacy users with only `localStorage.theme = "dark"` now load light; users who choose dark after this change persist that choice under `align-the-humans-theme-v2`.
- Verification case: set `localStorage.theme = "dark"`, remove `localStorage["align-the-humans-theme-v2"]`, reload, and confirm `<html>` does not receive `.dark`. Then toggle dark, reload, and confirm the new key preserves dark.

Risk:

- This intentionally resets old explicit dark preferences once. That is the correct tradeoff for the light-default product decision, and the toggle still lets users opt back into dark.

### [P1] Change font display by font role

Files:

- `app/layout.tsx`
- `design-system/tailwind.preset.ts`

Plan:

- Change Inter, the global UI/body font, from `optional` to `swap`:

```tsx
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
```

- Change Manrope, the display/heading font, from `optional` to `fallback`:

```tsx
const manrope = Manrope({
  subsets: ['latin'],
  display: 'fallback',
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})
```

- Leave the Tailwind font stacks in `design-system/tailwind.preset.ts` as-is. They already route `font-sans` to Inter and `font-display` to Manrope with Inter/system fallbacks.
- Tradeoff: `optional` gives roughly a 100ms invisible block and can leave the page in fallback for the full session on cold loads. `swap` makes UI text visible immediately and swaps to Inter whenever it arrives, with a small possible metric shift that Next font fallback adjustment should keep low. `fallback` gives Manrope a short swap window of roughly 3s, so headings get the brand face when it arrives quickly but do not jump late on slow cold loads.
- After implementation, run one cold-load check with browser cache disabled and one with Slow 3G/4x CPU. Watch for text CLS on the hero, header, and auth pages.

Risk:

- Inter may produce a small late text reflow on very slow font loads. That is preferable to invisible UI text or a full session stuck in fallback. Manrope may stay fallback on very slow loads, but it avoids late headline jumps.

### [P1] Render a deterministic ThemeToggle placeholder

Files:

- `components/theme/ThemeToggle.tsx`
- `components/layout/Header.tsx`
- `app/(auth)/layout.tsx`

Plan:

- Fix this in `components/theme/ThemeToggle.tsx`; no caller changes are needed in `Header` or the auth layout.
- Remove the pre-mount branch that returns an empty `Button`.
- Always render the same button shape and an icon. Use the light-default icon (`Moon`) as the pre-mount deterministic placeholder, then switch semantics after mount:

```tsx
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      onClick={() => {
        if (mounted) setTheme(isDark ? 'light' : 'dark');
      }}
      aria-label={
        mounted
          ? isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode'
          : 'Toggle theme'
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
```

- This keeps server markup, initial client markup, button dimensions, and icon geometry stable for the light-default path. Dark users on the new storage key may still see the icon change from `Moon` to `Sun` after hydration, but the button is never empty.

Risk:

- A click during the tiny pre-mount window is ignored. That is better than letting theme state mutate before hydration is known.

### [P1] Replace full-screen animated loading fallbacks with stable route-local shells

Files:

- `app/loading.tsx`
- `app/(auth)/loading.tsx`
- `app/dashboard/loading.tsx`
- `app/alignment/new/loading.tsx`
- `app/alignment/[id]/loading.tsx`
- `app/join/[token]/loading.tsx`

Plan:

- Delete `app/loading.tsx`. The body and design-system CSS already provide a light background, and the root fallback currently blanks the entire shell. Let route-level loading files handle real segment waits.
- Replace `app/(auth)/loading.tsx` with a compact child fallback that fits inside `app/(auth)/layout.tsx`'s existing centered `<main>`. Remove `Loader2`, remove full-screen `min-h-screen`, and use a static form-card skeleton:

```tsx
export default function AuthLoading() {
  return (
    <div className="w-full space-y-6" aria-hidden="true">
      <div className="mx-auto h-7 w-48 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 h-10 w-full rounded bg-muted" />
        <div className="mb-4 h-10 w-full rounded bg-muted" />
        <div className="h-11 w-full rounded bg-primary/20" />
      </div>
    </div>
  );
}
```

- In `dashboard`, `alignment/new`, and `alignment/[id]` loading files, keep the current skeleton structure but replace hardcoded first-paint colors with semantic tokens:
  - `bg-background-light dark:bg-background-dark` -> `bg-background`
  - `border-slate-200 dark:border-slate-800` -> `border-border`
  - `bg-slate-200 dark:bg-slate-800` -> `bg-muted`
  - `bg-white dark:bg-slate-900/50` -> `bg-card`
- Remove immediate `animate-pulse` from all route loading blocks, including `join/[token]/loading.tsx`. Static skeletons read as stable placeholders; pulsing on sub-second loads reads as flicker.
- Add `aria-hidden="true"` to decorative skeleton wrappers where no loading text is needed. Keep visible loading text only for waits that are expected to exceed a second.

Risk:

- Static skeletons feel less busy on long waits. If runtime profiling shows a real multi-second wait, add a delayed client-side progress affordance after 500-700ms rather than animating every fallback immediately.

### [P2] Harden design-system motion without changing tokens

Files:

- `app/globals.css`
- `design-system/styles/design-system.css`
- `design-system/tailwind.preset.ts`
- `design-system/README.md`

Plan:

- Leave `app/globals.css` as a single import. Do not add global transition rules there.
- Leave the light `:root`, `.dark`, and `body` token structure in `design-system/styles/design-system.css`. It is already light-first and works with next-themes class mode.
- Keep `.glass-card` and `.glow-card` transitions; `disableTransitionOnChange` now suppresses theme-change color animation globally.
- Add a reduced-motion guard at the end of `design-system/styles/design-system.css` for decorative utilities and Tailwind animation classes that can otherwise look like first-paint movement when used above the fold:

```css
@media (prefers-reduced-motion: reduce) {
  .particle,
  .animate-float,
  .animate-pulse-ring,
  .animate-fade-up {
    animation: none !important;
  }
}
```

- Do not use `animate-fade-up` on root loading states or above-the-fold structural chrome. If it is used later, apply it only to non-critical content after the stable shell is already visible.
- Update `design-system/README.md` in a separate cleanup pass to remove references to `.theme-emerald`, `.theme-indigo`, and `.theme-amber`; those classes are not present in the current stylesheet. This is documentation drift, not a runtime flash bug.

Risk:

- Reduced-motion users lose decorative animation. Normal-motion users keep the current visuals. The README cleanup is non-runtime and should not be mixed into the flicker fix unless the implementer is already touching docs.
