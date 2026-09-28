export function WebApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Align the Humans',
    url: 'https://alignthehumans.com',
    description:
      'A structured process for business partners and co-owners. Each partner answers on their own, an AI comparison surfaces different expectations and unspoken assumptions, and the pair builds a shared brief to review with their lawyer. Not legal advice.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser',
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Business partners and co-owners',
    },
    offers: {
      '@type': 'Offer',
      name: 'Partnership alignment pilot',
      price: '299',
      priceCurrency: 'USD',
      description: 'One partnership alignment for two partners.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Align the Humans',
      url: 'https://alignthehumans.com',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  )
}
