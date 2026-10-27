# Human Alignment

**Agree on the partnership before you commit to it.** For two business partners or co-owners.

Human Alignment is a Next.js 16 (`^16.4.3`) and React 19 (`^19.3.1`) web application. Two business partners each answer on their own, an AI comparison shows where their expectations differ, and they build a shared brief to review with a lawyer. The public site is that conversation before legal drafting. A lawyer still drafts the operating agreement from the brief.

## Core Philosophy

**Think independently. Align collectively. Decide confidently.**

The public site (`/`, `/example`, `/pricing`) speaks to two business partners or co-owners facing a real commitment:

- **Starting together, bringing someone in, or changing how you already work**
- **Independent answers**: Each person answers before seeing the other's
- **A brief for counsel**: The result is a shared brief. A lawyer drafts the agreement

## Features

### 5-Phase Alignment Workflow

1. **Scope** - Define what decision needs to be made
2. **Surface** - AI identifies what matters for your specific situation
3. **Consider** - Each person thinks independently without negotiation pressure
4. **Synthesize** - AI reveals patterns and possibilities neither person imagined
5. **Decide** - Co-create solutions with complete clarity on what matters

### Key Capabilities

- **AI-Powered Analysis**: OpenRouter compares responses and identifies conflicts. The primary model constant is `anthropic/claude-sonnet-4.6` (`AI_MODELS.SONNET` in `app/lib/ai-config.ts`). Each route sends the prompt row's model slug through `resolveModel()`.
- **Template Library**: Partnership terms, bringing someone in, equity, and operations
- **Real-time Collaboration**: Partner invitation and status tracking
- **Document Generation**: Export finalized agreements as PDF
- **Secure Authentication**: Supabase Auth with email verification

## Tech Stack

- **Framework**: Next.js `^16.4.3` (App Router), React `^19.3.1` (`package.json`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS. The default theme is light (`defaultTheme="light"` in `app/layout.tsx`).
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL with Row-Level Security). Schema source: `supabase/migrations`.
- **AI**: Vercel AI SDK (`ai` 5.0.222) through OpenRouter (`@openrouter/ai-sdk-provider`). Primary model: `anthropic/claude-sonnet-4.6`. `@ai-sdk/anthropic` is not a dependency.
- **Hosting**: Vercel
- **Repository**: Public at https://github.com/justfinethanku/align-the-humans

## Getting Started

### Prerequisites

- Node.js 20.9 or newer (the Next.js 16.4.3 engine range; CI uses Node 22)
- Supabase account and project
- OpenRouter API key (`OPEN_ROUTER_API_KEY`) for AI generation

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
- `INVITE_TOKEN_SECRET`: Random secret used to encrypt invite tokens before storage (any strong string)
- `OPEN_ROUTER_API_KEY`: OpenRouter API key for AI generation. The app reads this name first and falls back to `OPENROUTER_API_KEY` when it is unset.
- `RESEND_API_KEY`: Resend API key for transactional email (invites and auth mail)
- `SUPABASE_AUTH_HOOK_SECRET`: Standard Webhooks secret (`v1,whsec_...`) that verifies the Supabase Send Email hook at `/api/auth/email`
- `OPS_ALERT_EMAIL`: Optional comma-separated inbox for auth-hook 401/500s and rejected Resend sends. When unset, those failures are logged and no alert is sent.
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway key used only for the admin model-discovery list, not for generation (optional for local dev)

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

The current schema is the SQL in `supabase/migrations`. Apply those files to the Supabase project. `plan_a.md` is an older specification.

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
- `npm run type-check` - TypeScript check
- `npm test` - Seven `node --test` cases for the Supabase Auth email hook

### Code Style

- Follow TypeScript best practices
- Use Server Components by default
- Client Components only when needed (forms, interactivity)
- Implement loading.tsx and error.tsx for route segments

## Documentation

- **Testing**: See `docs/testing-runbook.md` for the current two-partner journey and the automated checks. `E2E_TEST_PLAN.md` has been removed.
- **Deploy and migrations**: See `docs/deploy.md` for how `main` and pull requests reach Vercel, how to compare `supabase/migrations` with the database, and how to roll back a deploy or a migration.
- **Database schema**: `supabase/migrations`
- **Technical specification**: `plan_a.md` is an older implementation spec. For current behavior, read the code and `supabase/migrations`.
- **Copy Guidelines**: See `scrapbook/website copy/philosophy_copy.md` for messaging strategy
- **Changelog**: See `/changelog/` for development history

## Contributing

This GitHub repository is public: https://github.com/justfinethanku/align-the-humans

Open an issue or a pull request.

## License

Proprietary - All rights reserved

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with structure. Designed for collaboration. Made for decisions that matter.**
