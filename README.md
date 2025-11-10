# Human Alignment

**Structure for every decision that matters** - from household chores to cofounder equity.

Human Alignment is a Next.js web application that facilitates collaborative decision-making through AI-guided structured conversations. The platform enables partners to think independently, align collectively, and decide confidently on any scale of decision.

## Core Philosophy

**Think independently. Align collectively. Decide confidently.**

Human Alignment transforms how people make decisions together by:

- **Scale-Agnostic Structure**: Same framework works for chore schedules and equity splits
- **Independent Thinking → Collective Intelligence**: Separate thinking from negotiating for better outcomes
- **Practice Compounds Trust**: Start with small decisions, build confidence for big ones
- **Proactive Alignment**: Align early and often, not just during crises

## Features

### 5-Phase Alignment Workflow

1. **Scope** - Define what decision needs to be made
2. **Surface** - AI identifies what matters for your specific situation
3. **Consider** - Each person thinks independently without negotiation pressure
4. **Synthesize** - AI reveals patterns and possibilities neither person imagined
5. **Decide** - Co-create solutions with complete clarity on what matters

### Key Capabilities

- **AI-Powered Analysis**: Claude Sonnet 4.5 analyzes responses and identifies conflicts
- **Template Library**: Pre-configured flows for common scenarios (cofounder agreements, household decisions, strategic planning)
- **Real-time Collaboration**: Partner invitation and status tracking
- **Document Generation**: Export finalized agreements as PDF
- **Secure Authentication**: Supabase Auth with email verification

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **AI**: Vercel AI SDK with Anthropic Claude Sonnet 4.5
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Anthropic API key (for Claude)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/justfinethanku/align-the-humans.git
cd align-the-humans
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-only)
- `AI_GATEWAY_API_KEY`: Your Vercel AI Gateway API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The application requires a Supabase database with the following tables:
- `profiles` - User accounts and metadata
- `alignments` - Main alignment sessions
- `alignment_participants` - Links users to alignments
- `alignment_responses` - Individual answers to questions
- `alignment_analyses` - AI analysis results
- `alignment_signatures` - Digital signatures for agreements
- `partners` - Partner relationships
- `templates` - Pre-configured alignment question sets

Refer to `plan_a.md` for complete database schema and setup instructions.

## Project Structure

```
/app
├── (auth)/              # Authentication pages (login, signup)
├── dashboard/           # User dashboard
├── alignment/           # Alignment workflow pages
│   ├── new/            # Create new alignment
│   └── [id]/           # Alignment-specific pages
│       ├── clarity/    # Define alignment scope
│       ├── questions/  # Answer questions
│       ├── analysis/   # View AI analysis
│       ├── resolution/ # Resolve conflicts
│       └── document/   # Final agreement
├── api/                # API routes
│   └── alignment/      # Alignment-related endpoints
├── lib/                # Shared utilities
└── components/         # Reusable React components

/changelog/             # Development session logs
/scrapbook/            # Design assets and copy guidelines
/design-system/        # Reusable Tailwind utilities
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint

### Code Style

- Follow TypeScript best practices
- Use Server Components by default
- Client Components only when needed (forms, interactivity)
- Implement loading.tsx and error.tsx for route segments

## Documentation

- **Technical Specification**: See `plan_a.md` for complete implementation details
- **Copy Guidelines**: See `scrapbook/website copy/philosophy_copy.md` for messaging strategy
- **Changelog**: See `/changelog/` for development history

## Contributing

This is currently a private project. Contribution guidelines will be added when the project goes public.

## License

Proprietary - All rights reserved

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with structure. Designed for collaboration. Made for decisions that matter.**
