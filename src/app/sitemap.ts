import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pgsetu.online'
  const currentDate = new Date()

  const cities = [
    'Bangalore',
    'Gurgaon',
    'Noida',
    'Delhi',
    'Pune',
    'Hyderabad',
    'Mumbai',
    'Chennai',
    'Ahmedabad',
    'Jaipur',
  ]

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/search-pg`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/software`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/portal`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/search?city=${encodeURIComponent(city)}`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticRoutes, ...cityRoutes]
}
