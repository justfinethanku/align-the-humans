export type UpgradeTierId = 'alignment_pass' | 'pro' | 'team'

export interface MonetizationTier {
  id: UpgradeTierId
  name: string
  price: string
  cadence: string
  description: string
  features: readonly string[]
  badge?: string
}

export const MONETIZATION_TIERS: readonly MonetizationTier[] = [
  {
    id: 'alignment_pass',
    name: 'Alignment Pass',
    price: '$12',
    cadence: 'one time',
    description: 'For the next decision that needs a real agreement.',
    features: [
      'One more creator alignment',
      'One agreement check-in',
      'No subscription',
    ],
  },
  {
    id: 'pro',
    name: 'Align Pro',
    price: '$19',
    cadence: 'per month · $180/year',
    description: 'For agreements that need to stay healthy as life changes.',
    features: [
      'Up to 10 new alignments per month',
      'Recurring check-ins and drift alerts',
      'Health dashboard, reminders, and renewals',
    ],
    badge: 'Best for ongoing agreements',
  },
  {
    id: 'team',
    name: 'Team',
    price: '$59',
    cadence: 'per month · coming later',
    description: 'For small teams managing several working agreements.',
    features: [
      'Shared workspace',
      'Five internal members',
      'Multi-party alignments',
    ],
  },
] as const
