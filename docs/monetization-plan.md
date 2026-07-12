# Monetization plan — Align the Humans

Joint memo, 2026-07-11. Written independently by Claude (Fable 5) and GPT-5.6 (sol),
then merged; the two proposals converged on every major point. Full originals in the
session collab dir.

## The one-sentence answer
Give every account **one complete alignment as creator, free** (invited partners never
pay and never burn their own free one), and make the thing people can't get enough of
the **living agreement**: recurring private pulse check-ins that detect drift between
partners and repair just the clause that changed — which reuses the analyze/resolve
machinery we already have.

## Why this hook (both models landed here independently)
A signed agreement is the acquisition event, not the product. Most pairs need one
roommate agreement — charging for wizard re-runs bakes in churn. But agreements
drift, and drift turns into fights precisely because nobody notices early. The
recurring unit of value: **private pulse → drift report → focused re-alignment on one
clause → signed amendment (v2, v1 immutable)**. Early warning is the subscription.
Every check-in re-engages BOTH parties (viral loop) and each invited partner keeps a
free creator credit (seeded growth).

## Tiers
| Tier | Price | Gets |
|---|---|---|
| Free | $0 | 1 complete creator alignment (questions → analysis → resolution → signed doc + PDF) + first 30-day check-in. Unlimited participation as invited partner. |
| Alignment Pass | $12 one-time | One more creator alignment + one check-in. For subscription-averse occasional users. |
| Align Pro | $19/mo · $180/yr | Up to 10 new alignments/mo, recurring check-ins on all agreements, drift alerts, agreement-health dashboard, versioned renewals, reminders. |
| Team | $59/mo (later) | Workspace, 5 internal members, multi-party alignments. NOT now — schema/analysis are pair-specific. |

Pricing spread between the models: Claude proposed $12/mo Plus, GPT-5.6 proposed
$19/mo Pro + $12 one-off Pass. Merged view: keep both price experiments cheap to
run; launch with Pass + Pro and test $12 vs $19 on Pro. Jon decides final numbers.

## Mechanics both models insist on
- Only the CREATOR consumes a credit; consumed at question generation (first real AI
  cost), not at draft. Deleting doesn't refund. Abandoned drafts don't consume.
- Never cripple the free run: the signed agreement + PDF is the shareable "wow."
  Gate NEW activations, never access to existing work (also post-cancellation).
- No visible AI metering, no streaks/gamification. Return trigger = a real agreement,
  a scheduled moment, a detected change.
- Enforce server-side via an `account_entitlements` row (service-role writes only) +
  transactional claim function at `/api/alignment/generate-questions`. Never a
  client-side count.

## This week (no Stripe keys yet)
1. `account_entitlements` table + claim RPC, created from the same auth trigger path.
2. Gate + upgrade modal + /pricing page (tiers above), "1 of 1 free used" on dashboard.
3. Upgrade-intent capture ("Get early access" logs to DB) so demand is measured
   before billing exists; admin comp switch for testers.
4. Thin check-in preview: completed pairs can schedule a 30-day check-in (dashboard
   card + reminder) — makes the Pro promise concrete.
5. Funnel events: claimed, invited, joined, both-submitted, signed, second-attempt,
   upgrade-viewed, intent-clicked. Key metric: % of signing pairs that schedule a
   check-in, and % of creators attempting alignment #2.

## Later
- Stripe Checkout (Pass + Pro) + webhook-driven entitlements + customer portal.
- Full living-agreements engine (clause extraction, cadence per template, drift
  scoring, redline amendments, renewal signatures).
- Team workspaces / multi-party (real schema project).
