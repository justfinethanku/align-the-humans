import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/alignment/',
          '/alignment/*',
          '/api/',
          '/api/*',
          '/auth/callback',
          '/join/*',
        ],
      },
      // OpenAI's GPT crawler
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      // ChatGPT user-triggered crawler
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      // Claude AI crawler
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      // Perplexity AI crawlers
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      // Google Extended (for Bard/Gemini)
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      // Common Crawl (used by many AI models)
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
      // Amazon's crawler
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/dashboard', '/alignment/', '/api/', '/auth/', '/join/'],
      },
    ],
    sitemap: 'https://alignthehumans.com/sitemap.xml',
  }
}
