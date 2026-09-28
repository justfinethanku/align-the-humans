export async function GET() {
  const llmsTxt = `# Align the Humans

> Align the Humans helps two business partners find out what they are actually agreeing to before money, ownership, and expectations make it painful to find out later. Each partner answers on their own, an AI comparison surfaces different expectations and unspoken assumptions, and the pair works through the differences into a shared brief they review with their lawyer.

## Who it is for

Two business partners or co-owners facing a real commitment or change:

- **Starting a business together:** forming an agency, studio, consultancy, or practice and about to split ownership, money, and work.
- **Bringing someone into the company:** a new partner or senior person joining, with equity, pay, authority, and expectations to settle.
- **Changing how they already work:** one partner wants to cut back, start taking a salary, or take on more.

It currently supports two people per alignment.

## How it works

1. **Each partner answers alone.** Questions cover ownership, pay, roles, decision-making, clients, intellectual property, and what happens if someone leaves. Neither partner sees the other's answers until both have submitted.
2. **See the comparison.** The analysis shows where the partners agree, where they differ, assumptions neither said out loud, topics both skipped, and imbalances between them.
3. **Work through the differences.** Focused rounds on what actually differs, with options beyond splitting the difference. The AI suggests options; the partners make every decision.
4. **Take the brief to a lawyer.** Both partners review and confirm the same plain-language record of what they decided, with a PDF copy.

## What it is not

- Not a law firm and not legal advice.
- Not a finished operating agreement, contract, or equity paperwork. The brief is a starting point for the partners' lawyer.
- Not a guarantee of agreement. Learning that the partners should not proceed on certain terms is treated as a valuable outcome.

## Example

Two partners agree on a 50/50 split of a new agency. One assumes both take a $6,000 monthly salary before profit; the other assumes no salaries in year one. One assumes existing clients become company clients; the other assumes they stay with whoever brought them. A record that says "50/50, agreed" misses those differences. A full worked example is at https://alignthehumans.com/example

## Pricing

Pilot pricing is $299 per pair for one partnership alignment. The invited partner joins free. Billing is not live yet; pilot pairs confirm details before anything is charged. Details: https://alignthehumans.com/pricing

## Links

- Home: https://alignthehumans.com
- Example alignment: https://alignthehumans.com/example
- Pricing: https://alignthehumans.com/pricing
- Terms: https://alignthehumans.com/terms
- Privacy: https://alignthehumans.com/privacy

Last updated: 2026-09-27
`

  return new Response(llmsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
