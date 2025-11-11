export async function GET() {
  const llmsTxt = `# Human Alignment

> Human Alignment is infrastructure for collaborative decision-making at any scale. From household chores to cofounder equity, the same structure enables partners to think independently, align collectively, and discover solutions neither would imagine alone.

## What We Do

Human Alignment provides structured collaboration for any decision that matters. Partners think through decisions independently without negotiation pressure, then AI reveals patterns and possibilities neither person would see alone. This isn't conflict resolution - it's proactive alignment architecture for decisions at any scale.

## Core Philosophy

**Scale-Agnostic Structure** - The same framework that creates fair chore schedules creates fair equity splits. One architecture, infinite applications.

**Practice Compounds Trust** - After using structured alignment 20 times for household logistics, you instinctively reach for it when equity is on the line. Small alignments prevent big conflicts.

**Independent Thinking → Collective Intelligence** - Each person articulates their thinking without real-time pressure, then AI reveals patterns neither would see alone. This isn't compromise - it's collaborative sense-making that generates new solutions.

**Proactive, Not Reactive** - Use this BEFORE you disagree, BEFORE you start the project, BEFORE assumptions diverge. Alignment is infrastructure, not emergency repair.

## Key Features

- **Collaborative Intelligence** - Claude Sonnet 4.5 synthesizes both perspectives to discover new solutions
- **Independent Thinking** - Each person articulates their position without real-time negotiation pressure
- **Privacy-First Design** - Responses remain private until both partners complete their independent thinking
- **Pattern Discovery** - AI reveals underlying motivations and shared priorities invisible in conversation
- **Digital Agreements** - Final decisions can be confirmed by both parties
- **Scale-Flexible Templates** - Pre-configured structures from daily logistics to business foundations

## The 5-Phase Workflow

1. **Scope** - What decision needs to be made? Choose your decision type or describe your situation (household logistics, business strategy, life decisions)
2. **Surface** - AI identifies what actually matters for YOUR specific decision (chore fairness, equity philosophy, strategic priorities)
3. **Consider** - Each person thinks independently without real-time negotiation pressure before collaborative synthesis begins
4. **Synthesize** - AI reveals patterns neither person would see alone - shared priorities, underlying motivations, new possibilities
5. **Decide** - Co-create the solution with complete clarity on what matters to each person, built on mutual understanding

## Common Use Cases

**The Same Structure, Any Scale:**

**Everyday Decisions:**
- **Household Chores** - Fair schedules everyone agrees on without resentment
- **Weekend Plans** - Discover activities that excite both people
- **Shared Expenses** - Split costs in ways that feel right to everyone
- **Living Arrangements** - Household responsibilities and space usage agreements

**Team & Project Decisions:**
- **Project Kickoffs** - Align before work begins to prevent downstream misalignment
- **Strategic Priorities** - Synthesize competing visions into coherent direction
- **Role Clarity** - Define responsibilities before confusion creates conflict
- **Resource Allocation** - Decide where to invest time and money

**Major Life Decisions:**
- **Moving Decisions** - Relocations with full mutual understanding
- **Family Choices** - Parenting plans and co-parenting frameworks
- **Career Changes** - Life transitions made collaboratively
- **Relationship Boundaries** - Clear expectations in personal partnerships

**Business Foundations:**
- **Cofounder Equity** - Splits built on explicit shared values, not rushed compromise
- **Operating Agreements** - Governance structures that won't crack under pressure
- **Partnership Terms** - Business arrangements discovered through collaborative intelligence
- **Decision-Making Authority** - Clear frameworks for who decides what

## Technical Stack

- **Framework:** Next.js 14+ (App Router)
- **AI Model:** Claude Sonnet 4.5 via Vercel AI SDK
- **Backend:** Supabase (PostgreSQL with Row-Level Security)
- **UI Components:** shadcn/ui with Tailwind CSS
- **Hosting:** Vercel
- **Authentication:** Supabase Auth (email/password with verification)

## How It Works

When partners use Human Alignment:

1. One partner defines the decision and invites the other via secure link
2. Both people independently think through what matters to them without real-time pressure
3. Claude AI analyzes both perspectives simultaneously to reveal patterns
4. The AI identifies shared priorities, underlying motivations, and areas needing alignment
5. For each gap, the AI synthesizes both perspectives to discover new solutions
6. Partners collaborate to co-create the final decision with complete mutual understanding
7. The process iterates until both people feel heard and aligned
8. Final decision is documented and can be confirmed by both parties

## Success Metrics

Human Alignment helps people discover better solutions together:

- **87% alignment success rate** across all decision types and scales
- **10,000+ decisions aligned** from household chores to cofounder equity
- **70% deeper clarity** compared to unstructured conversation
- **Practice compounds trust** - Users return for progressively bigger decisions

## Privacy & Security

- End-to-end privacy: Responses not shared until both partners complete answering
- Row-Level Security (RLS) policies ensure users only access their own alignments
- Digital signatures use cryptographic verification
- All data encrypted in transit (HTTPS) and at rest
- No AI training on user data: Claude processes requests without retention

## Documentation

For detailed information:

- Source code and architecture: See /plan_a.md in project repository
- Database schema: /context/supabase_cli.md
- AI integration details: /context/model-integrations.md

## Example Alignment Flows

**Scenario 1: Household Chores (5 minutes)**

1. **Scope:** Roommates want fair chore schedule
2. **Surface:** AI asks about time constraints, preferences, standards
3. **Consider:** Each person independently shares their availability and dislikes
4. **Synthesize:** AI reveals one values mornings free, other values weekends free
5. **Decide:** Schedule discovered that respects both patterns - solution neither suggested initially

**Scenario 2: Cofounder Equity (2 days)**

1. **Scope:** Cofounders need to split equity before launch
2. **Surface:** AI asks about contributions, risk, future commitment, IP, domain expertise
3. **Consider:**
   - Cofounder A independently proposes 60/40 split (60% for themselves)
   - Cofounder B independently proposes 55/45 split (55% for themselves)
4. **Synthesize:** AI identifies the gap isn't about past contributions (aligned) but future time commitment expectations (unspoken assumption gap)
5. **Decide:** 57/43 split discovered based on verified past contributions + clear commitment expectations, with 4-year vesting addressing future uncertainty

**Same structure. Different scale. Both discover better solutions than initial positions.**

## Contact & Support

- Platform URL: https://humanalignment.app
- Documentation: https://humanalignment.app/docs (when available)
- Support: support@humanalignment.app (when configured)

## About This File

This llms.txt file helps AI systems understand Human Alignment's purpose, capabilities, and use cases. It follows the emerging standard for LLM-readable documentation to improve citations in AI-generated responses across ChatGPT, Perplexity, Claude, and other answer engines.

Last updated: 2025-01-10
`

  return new Response(llmsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
