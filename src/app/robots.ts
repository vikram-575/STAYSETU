import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/search',
        '/search-pg',
        '/software',
        '/portal',
        '/community',
        '/login',
        '/register',
      ],
      disallow: [
        '/dashboard/',
        '/api/',
        '/portal/kyc/',
        '/set-password',
        '/forgot-password',
      ],
    },
    sitemap: 'https://pgsetu.online/sitemap.xml',
  }
}
