export function HowToSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Align on Any Decision Using Structured Collaboration',
    description:
      'Step-by-step guide to using structured collaboration for decisions at any scale - from household chores to business strategy',
    totalTime: 'PT2H',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Scope',
        text: 'Define what decision needs to be made. Choose your decision type or describe your own situation. Works for household logistics or business strategy.',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: 'Surface',
        text: 'AI identifies what actually matters for YOUR specific decision. Whether it\'s chore fairness or equity philosophy, the questions adapt to what you need to align on.',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: 'Consider',
        text: 'Each person thinks independently without real-time negotiation pressure. Articulate what matters to you before collaborative synthesis begins.',
        position: 3,
      },
      {
        '@type': 'HowToStep',
        name: 'Synthesize',
        text: 'AI reveals patterns neither person would see alone. Discover shared priorities, underlying motivations, and possibilities you hadn\'t imagined.',
        position: 4,
      },
      {
        '@type': 'HowToStep',
        name: 'Decide',
        text: 'Co-create the solution with complete clarity on what matters to each person. Generate agreements built on mutual understanding, not compromise.',
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
