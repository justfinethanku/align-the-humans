import { HOW_IT_WORKS_STEPS } from '@/components/homepage/HowItWorks'

export function HowToSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How business partners get clear on their terms before they commit',
    description:
      'Each partner answers questions about ownership, money, roles, decisions, and exits on their own. Compare the answers to find different expectations, work through the differences, and take a shared brief to your lawyer.',
    step: HOW_IT_WORKS_STEPS.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.body,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  )
}
