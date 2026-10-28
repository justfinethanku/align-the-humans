// The app's own Supabase URL. Hosted projects already match *.supabase.co;
// a local stack (http://127.0.0.1:...) needs its exact origin listed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;
const supabaseConnectSources = supabaseUrl
  ? [supabaseUrl.origin, supabaseUrl.origin.replace(/^http/, 'ws')]
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cursor browser previews use 127.0.0.1 for the development HMR socket.
  // Keep Next dev from rewriting the repo-owned agent instructions.
  agentRules: false,
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      // Enforced. Reports go to /api/csp-report (report-uri and report-to).
      // Inline scripts: Next.js bootstrap, next-themes, JSON-LD.
      // Fonts are self-hosted by next/font. PDF export uses a blob worker.
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "script-src 'self' 'unsafe-inline'",
          "worker-src 'self' blob:",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "img-src 'self' data: blob: https://*.supabase.co",
          [
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            ...supabaseConnectSources,
            'https://ai-gateway.vercel.sh https://openrouter.ai',
          ].join(' '),
          "manifest-src 'self'",
          "report-uri /api/csp-report",
          "report-to csp",
        ].join('; '),
      },
      {
        key: 'Reporting-Endpoints',
        value: 'csp="/api/csp-report"',
      },
    ]

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
