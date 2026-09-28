/**
 * Offer shown on the marketing site and in the in-app upgrade dialog.
 *
 * Positioning (2026-09-27): one paid partnership-alignment pilot per pair,
 * instead of the earlier $12 pass / $19 Pro / $59 Team ladder. Billing is not
 * live; the call to action records early-access interest.
 */
export const PILOT_OFFER = {
  id: 'partnership_pilot',
  name: 'Partnership alignment pilot',
  price: '$299',
  cadence: 'per pair',
  description:
    'Pilot pricing is $299 for you and your partner together: a question set for each of you, the AI comparison, guided rounds on what differs, and a shared brief for your lawyer.',
  billingNote:
    'Billing isn’t live yet. Request a pilot spot and we’ll confirm the details with you before anything is charged.',
  features: [
    'One partnership alignment for two partners',
    'A separate question set for each of you, built for your situation',
    'AI comparison: agreements, differences, unspoken assumptions, skipped topics',
    'Guided rounds to work through what differs',
    'A shared partnership brief you both confirm, with a PDF copy',
    'Your partner joins free through your invite link',
  ],
  excludes: [
    'Legal advice. We’re not a law firm.',
    'A finished operating agreement, contract, or equity paperwork. Your lawyer drafts those from your brief.',
    'A promise that you’ll agree. Sometimes the useful answer is that you don’t.',
  ],
} as const

export type UpgradeTierId = typeof PILOT_OFFER.id
