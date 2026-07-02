export function WebApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Human Alignment',
    url: 'https://alignthehumans.com',
    description:
      'Infrastructure for collaborative decision-making at any scale. From household chores to cofounder equity, structured collaboration that turns any decision into clarity.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with basic alignment features',
    },
    author: {
      '@type': 'Organization',
      name: 'Human Alignment',
      url: 'https://alignthehumans.com',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  )
}
