export function HowToSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Agree on Hard Decisions Without the Fight',
    description:
      'Step-by-step guide to reaching real agreement on high-stakes decisions - answer independently, let AI find common ground, resolve only the conflicts that matter, and sign a written agreement',
    totalTime: 'PT2H',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Answer privately',
        text: 'Each of you answers the same hard questions independently. No anchoring, no performing, no pressure.',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: 'See where you already agree',
        text: 'AI compares both sides and shows your common ground first - it\'s almost always more than you feared.',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: 'Name the real conflicts',
        text: 'The genuine disagreements get named precisely, ranked by what actually matters.',
        position: 3,
      },
      {
        '@type': 'HowToStep',
        name: 'Resolve what matters',
        text: 'Work through only the few conflicts that count, with AI suggesting fair middle ground.',
        position: 4,
      },
      {
        '@type': 'HowToStep',
        name: 'Sign it',
        text: 'Walk away with a written agreement you both believe in - and the relationship intact.',
        position: 5,
      },
    ],
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
