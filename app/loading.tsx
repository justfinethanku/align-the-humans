/**
 * Root App Loading State
 *
 * Minimal loading state that just maintains the background color
 * to prevent flash of white/unstyled content
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark" />
  );
}
