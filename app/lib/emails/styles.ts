/**
 * Shared email styles
 *
 * Consistent branding across all email templates.
 * Dark theme matching the app's design.
 */

export const colors = {
  background: '#0a0a0a',
  cardBackground: '#171717',
  border: '#262626',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
};

export const baseStyles = {
  body: {
    backgroundColor: colors.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: '0',
    padding: '0',
  },
  container: {
    backgroundColor: colors.cardBackground,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    margin: '40px auto',
    padding: '40px',
    maxWidth: '560px',
  },
  heading: {
    color: colors.text,
    fontSize: '24px',
    fontWeight: '600' as const,
    lineHeight: '1.3',
    margin: '0 0 16px 0',
  },
  text: {
    color: colors.textMuted,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600' as const,
    lineHeight: '1',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  footer: {
    color: colors.textMuted,
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '32px 0 0 0',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '24px',
  },
  link: {
    color: colors.primary,
    textDecoration: 'underline',
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${colors.border}`,
    margin: '24px 0',
  },
};
