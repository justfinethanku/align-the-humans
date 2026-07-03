# theme-flicker audit

## Verdict
ISSUES-FOUND

## Findings

### [medium] [CONFIRMED] Persisted dark theme still wins over the new light default
File: app/layout.tsx:113; node_modules/next-themes/dist/index.mjs:1
What happens: The root provider sets `defaultTheme="light"` and `enableSystem={false}`, but it does not set a new `storageKey`, force light, or migrate old stored values. The imported `next-themes` provider defaults to storage key `theme` and resolves the bootstrap value from `localStorage.getItem(storageKey) || defaultTheme`, so a returning user with `localStorage.theme = "dark"` still gets the dark class.
User-visible effect: Returning users who previously saved dark continue loading dark even after the app-level default changed to light. If the browser paints the light `:root` and body defaults before the bootstrap class is applied, that user can see a light-to-dark flash.
Fix sketch: Add a one-time, versioned theme migration that clears or rewrites old `theme=dark` values, or change to a new storage key for the light-default era. If the product decision is universal light, force `light` once behind a migration flag rather than relying on `defaultTheme`.

### [medium] [CONFIRMED] Both global fonts use font-display optional
File: app/layout.tsx:7
What happens: `Inter` is configured with `display: 'optional'` at line 9, and `Manrope` is configured the same way at line 15. The Tailwind preset then makes those font variables the global `font-sans` and `font-display` stacks at `design-system/tailwind.preset.ts:89`.
User-visible effect: Text can briefly render invisible or stay in fallback depending on font cache/network timing, and pages using both sans and display text can show a subtle text appearance shift. That reads as rendering flicker even when the theme itself is stable.
Fix sketch: Test `display: 'swap'` or `display: 'fallback'` for the global UI font, reduce the number of first-paint font families, and verify CLS/text paint in a throttled cold load. If `optional` stays, use it intentionally for non-critical display text rather than both global families.

### [medium] [CONFIRMED] Theme changes are allowed to animate component color transitions
File: components/ui/button.tsx:8
What happens: The shared `Button` class includes `transition-colors`; `ThemeToggle` calls `setTheme(...)` at `components/theme/ThemeToggle.tsx:34`; Header/Footer links also use `transition-colors` at `components/layout/Header.tsx:20` and `components/layout/Footer.tsx:34`. The root provider at `app/layout.tsx:113` does not pass `disableTransitionOnChange`, so color, background, and border changes from the `.dark`/`.light` class swap are not globally suppressed.
User-visible effect: On a manual theme toggle, header links, footer links, buttons, and other transition-enabled surfaces can fade between token values. If any initial theme correction happens after first paint, the same transitions can make the load look like a theme flash.
Fix sketch: Pass `disableTransitionOnChange` into `ThemeProvider`, or add an app-level temporary no-transition style around theme class mutations. Keep hover transitions, but suppress transitions specifically while the root theme class is changing.

### [low] [CONFIRMED] Theme toggle swaps visible markup after mount
File: components/theme/ThemeToggle.tsx:16
What happens: Before mount, `ThemeToggle` returns an empty icon-sized `Button` at lines 16-24. After `useEffect` sets `mounted` to true at lines 12-14, the component renders a different button with text classes, a theme-specific aria label, and a Sun/Moon icon at lines 29-37. The fixed header renders this toggle at `components/layout/Header.tsx:54`, and the auth layout renders it at `app/(auth)/layout.tsx:42`.
User-visible effect: The reserved button avoids layout shift, but the icon still pops into the header after hydration. On pages with a prominent fixed header, that pop can look like a small flicker.
Fix sketch: Render a stable placeholder that includes an invisible icon, or render a deterministic light-default icon until mounted and only swap the semantic theme state after hydration. Keep the button dimensions unchanged.

### [low] [SUSPECTED] Loading fallbacks can flash blank or skeleton screens on quick navigations
File: app/loading.tsx:7
What happens: The root loading fallback returns only a full-screen background div at line 9. Route-level loading files also define full-screen pulse/spinner fallbacks, for example `app/dashboard/loading.tsx:8` plus pulse blocks at lines 12-15, and `app/(auth)/loading.tsx:11` plus a spinning loader at line 13. App Router will show these when a segment suspends; whether they appear on fast navigations needs runtime profiling.
User-visible effect: A quick navigation can briefly replace the prior page with a blank background or pulsing skeleton before final content, which users may describe as flicker even when theme hydration is correct.
Fix sketch: Remove or minimize the root `app/loading.tsx` fallback if it blanks the whole shell. Prefer route-local Suspense fallbacks that preserve persistent layout, and avoid pulse/spinner animations for loads that usually finish under a few hundred milliseconds.

## Flow trace

First page load:
1. The server renders `<html>` with only the Inter and Manrope font variable classes plus `suppressHydrationWarning` (`app/layout.tsx:103`). It does not render a theme class from the server.
2. `app/globals.css:1` imports `design-system/styles/design-system.css`. That file defines light tokens on `:root` at lines 6-117, dark tokens under `.dark` at lines 119-179, and body background/text color at lines 185-193.
3. Tailwind is in class-based dark mode (`design-system/tailwind.preset.ts:16`), so dark styling depends on a `.dark` class on an ancestor, normally `<html>`.
4. The body renders `font-sans antialiased` (`app/layout.tsx:112`) and wraps children in `ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}` (`app/layout.tsx:113`).
5. `components/theme/ThemeProvider.tsx:10` forwards those props directly to `next-themes`. The dependency bootstrap script reads the stored theme from `localStorage.theme`; if none exists, it uses the app's light default.
6. New users with no stored theme land on the light token path. Returning users with stored `dark` get the `.dark` class applied and continue in dark unless a migration clears that value.
7. Hydration then runs client components. `ThemeToggle` initially matches its server output with an empty button, then `useEffect` flips `mounted` and inserts the visible Sun/Moon icon.
8. If a segment suspends, `app/loading.tsx` can show the root background-only fallback; route-level loading files can show pulse/spinner skeletons.
9. If an error boundary is hit, `app/error.tsx:26` renders a full-screen error state using `bg-background-light dark:bg-background-dark`, then its client `useEffect` logs the error.

Theme toggle:
1. The user clicks the toggle button rendered by `ThemeToggle`.
2. `components/theme/ThemeToggle.tsx:34` calls `setTheme(isDark ? 'light' : 'dark')`.
3. `next-themes` updates `localStorage.theme` and mutates `document.documentElement` because the provider uses `attribute="class"`.
4. The `.dark` or light class state changes the CSS variables from `design-system/styles/design-system.css`, including body background/text colors and every Tailwind token that points at those variables.
5. `ThemeToggle` re-renders with the opposite icon and aria label.
6. Components with `transition-colors`, `transition-all`, or related utilities animate changed color/background/border values unless theme-change transitions are explicitly disabled.
