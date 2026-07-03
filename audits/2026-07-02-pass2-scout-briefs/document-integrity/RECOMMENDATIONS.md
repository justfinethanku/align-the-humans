# document-integrity scout

## Current state

The current signing flow does not have a single agreement artifact per round. `app/api/alignment/[id]/sign/route.ts` builds a fresh `canonical_snapshot` for each signer, includes a fresh timestamp in the hashed object, and stores that snapshot on the individual `alignment_signatures` row. The unique constraint only prevents the same user from signing twice; it does not prove both users signed the same hash.

The rendered agreement is not persisted. `app/alignment/[id]/document/components/document-content.tsx` regenerates document HTML in a client `useEffect` by calling `/api/alignment/generate-document`, and the page passes viewer-relative participant order. Signer A and signer B can therefore review different bytes before any template/prompt drift is considered.

The document page and sign API both treat `status = 'resolving'` as enough. Neither performs a shared server-side check that the current round has a latest analysis and that `analysis.summary.conflicts` is empty.

The sign endpoint is not idempotent under concurrency. It checks for an existing row before inserting, but a double POST can still lose the `(alignment_id, user_id, round)` race and return a raw failure. Completion emails are sent whenever `allSigned` is true, rather than only by the request that actually transitions `resolving -> complete`.

PDF export captures only `#alignment-document`. The executed signature block is rendered outside that node, so the downloaded agreement omits signer names and timestamps.

## Recommendations

### P0 Create one immutable agreement snapshot table

Files:

- `supabase/migrations/20260703000100_create_alignment_agreement_snapshots.sql`
- `app/lib/database.types.ts`
- `app/lib/types.ts`
- `app/lib/db-helpers.ts`
- New: `app/lib/agreement-document.ts`
- New: `app/lib/agreement-snapshots.ts`

Plan:

1. Store the frozen artifact in a new table, `public.alignment_agreement_snapshots`, with `unique (alignment_id, round)`.
   - Do not store the shared snapshot only on `alignment_signatures`: that table is one row per signer, so the invariant would be cross-row and race-prone.
   - Do not add current-snapshot columns to `alignments`: `alignments` is the workflow instance, not a per-round artifact store.
   - Do not reuse `alignment_analyses`: analysis rows are model output; overloading them with executed document storage makes the legal artifact depend on an analysis update surface.
   - The new table is the clean minimal model: one alignment round has one immutable agreement artifact, and signatures reference it.

2. Add this migration:

```sql
-- supabase/migrations/20260703000100_create_alignment_agreement_snapshots.sql

create extension if not exists "pgcrypto" with schema extensions;

create table if not exists public.alignment_agreement_snapshots (
  id uuid primary key default gen_random_uuid(),
  alignment_id uuid not null references public.alignments(id) on delete cascade,
  round int not null,
  snapshot_hash text not null check (snapshot_hash ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null,
  document_html text not null,
  document_sections jsonb not null default '[]'::jsonb,
  document_inputs jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  frozen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint alignment_agreement_snapshots_one_per_round unique (alignment_id, round),
  constraint alignment_agreement_snapshots_hash_matches_payload check (snapshot->>'hash' = snapshot_hash),
  constraint alignment_agreement_snapshots_signature_fk_unique unique (alignment_id, round, id, snapshot_hash)
);

alter table public.alignment_signatures
  add column if not exists agreement_snapshot_id uuid,
  add column if not exists agreement_snapshot_hash text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_pair'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_pair
      check (
        (agreement_snapshot_id is null and agreement_snapshot_hash is null)
        or
        (agreement_snapshot_id is not null and agreement_snapshot_hash is not null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_hash_format'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_hash_format
      check (agreement_snapshot_hash is null or agreement_snapshot_hash ~ '^[a-f0-9]{64}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_hash_matches_payload'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_hash_matches_payload
      check (
        agreement_snapshot_hash is null
        or nullif(canonical_snapshot->>'hash', '') = agreement_snapshot_hash
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alignment_signatures_agreement_snapshot_fk'
  ) then
    alter table public.alignment_signatures
      add constraint alignment_signatures_agreement_snapshot_fk
      foreign key (alignment_id, round, agreement_snapshot_id, agreement_snapshot_hash)
      references public.alignment_agreement_snapshots(alignment_id, round, id, snapshot_hash)
      on delete restrict;
  end if;
end $$;

create index if not exists idx_alignment_agreement_snapshots_alignment_round
  on public.alignment_agreement_snapshots(alignment_id, round);

create index if not exists idx_alignment_agreement_snapshots_hash
  on public.alignment_agreement_snapshots(snapshot_hash);

create index if not exists idx_alignment_signatures_alignment_round_snapshot
  on public.alignment_signatures(alignment_id, round, agreement_snapshot_hash);

alter table public.alignment_agreement_snapshots enable row level security;

grant select, insert on public.alignment_agreement_snapshots to authenticated;

drop policy if exists "agreement_snapshots_read_participants"
  on public.alignment_agreement_snapshots;

create policy "agreement_snapshots_read_participants"
on public.alignment_agreement_snapshots
for select to authenticated
using (
  exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = alignment_agreement_snapshots.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

drop policy if exists "agreement_snapshots_insert_participants"
  on public.alignment_agreement_snapshots;

create policy "agreement_snapshots_insert_participants"
on public.alignment_agreement_snapshots
for insert to authenticated
with check (
  exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = alignment_agreement_snapshots.alignment_id
      and ap.user_id = (select auth.uid())
  )
);

create or replace function public.block_alignment_agreement_snapshot_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Agreement snapshots are immutable once created'
    using errcode = '55000';
end;
$$;

drop trigger if exists trg_block_alignment_agreement_snapshot_update
  on public.alignment_agreement_snapshots;

create trigger trg_block_alignment_agreement_snapshot_update
before update on public.alignment_agreement_snapshots
for each row
execute function public.block_alignment_agreement_snapshot_mutation();

drop trigger if exists trg_block_alignment_agreement_snapshot_delete
  on public.alignment_agreement_snapshots;

create trigger trg_block_alignment_agreement_snapshot_delete
before delete on public.alignment_agreement_snapshots
for each row
execute function public.block_alignment_agreement_snapshot_mutation();
```

3. Update generated/manual DB types:
   - Add `alignment_agreement_snapshots` with `Row`, `Insert`, `Update`, and relationships to `alignments` / `alignment_status_view`.
   - Add nullable `agreement_snapshot_id: string | null` and `agreement_snapshot_hash: string | null` to `alignment_signatures.Row`.
   - Add optional versions of those two fields to `alignment_signatures.Insert` and `Update`.

4. Replace the current `CanonicalSnapshot` type with a stable content-addressed shape:

```ts
export interface DocumentSection {
  id: string;
  heading: string;
  body: string;
}

export interface CanonicalSnapshotHashInput {
  snapshot_version: 1;
  alignment_id: string;
  round: number;
  source: {
    alignment_updated_at: string;
    analysis_id: string;
    analysis_created_at: string;
    template_id: string | null;
    template_version: number | null;
    template_content_hash: string | null;
    document_prompt: {
      slug: 'document-skeleton';
      prompt_id: string | null;
      updated_at: string | null;
      template_hash: string;
    };
  };
  participants: Array<{
    user_id: string;
    role: 'owner' | 'partner';
    display_name: string | null;
    order: number;
  }>;
  responses: Array<{
    user_id: string;
    response_id: string;
    response_version: number;
    submitted_at: string;
    answers: ResponseAnswers;
  }>;
  analysis: AnalysisSummary;
  document: {
    html: string;
    sections: DocumentSection[];
    inputs: {
      participant_names: string[];
      document_date: string;
      template_name: string;
      template_category: string;
      final_positions: Record<string, unknown>;
      summary: string[];
    };
  };
}

export interface CanonicalSnapshot extends CanonicalSnapshotHashInput {
  hash: string;
  frozen_at: string;
}
```

5. Hashing rule:
   - `hash = sha256(stableStringify(snapshotWithoutHashAndFrozenAt))`.
   - `stableStringify` must sort object keys recursively.
   - Arrays preserve intentional order.
   - Participants must be ordered by role (`owner`, then `partner`), then `created_at`, then `user_id`.
   - Responses must be ordered by `user_id`.
   - Do not include `frozen_at`, `created_at`, request timestamp, viewer identity, or locale-dependent render output in the hash input.

6. Create `app/lib/agreement-document.ts` by moving document rendering out of `app/api/alignment/generate-document/route.ts`. Export these shapes:

```ts
export interface RenderAgreementDocumentInput {
  participantNames: string[];
  documentDate: string;
  templateName: string;
  templateCategory: string;
  finalPositions: Record<string, unknown>;
  summary: string[];
  skeletonHtml: string;
}

export function renderAgreementDocument(input: RenderAgreementDocumentInput): {
  documentHtml: string;
  sections: DocumentSection[];
}
```

7. `renderAgreementDocument` must:
   - Reuse `parseDocumentSections`, `escapeHtml`, `humanizeKey`, and `renderPositionBody`.
   - Use a deterministic `documentDate`, derived from `analysis.created_at` and formatted with `timeZone: 'UTC'`.
   - Sanitize the rendered HTML before hashing/storing it, using the same allowlist currently in `DocumentContent`.
   - Return the sanitized HTML. The client may sanitize defensively again, but the server hash is based on the stored sanitized string.

8. Create `app/lib/agreement-snapshots.ts` with:

```ts
export interface AgreementSnapshotView {
  id: string | null;
  hash: string;
  snapshot: CanonicalSnapshot;
  documentHtml: string;
  documentSections: DocumentSection[];
  documentInputs: CanonicalSnapshot['document']['inputs'];
  isFrozen: boolean;
}

export async function buildAgreementSnapshotPreview(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<AgreementSnapshotView>;

export async function loadFrozenAgreementSnapshot(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<AgreementSnapshotView | null>;

export async function getOrCreateFrozenAgreementSnapshot(params: {
  supabase: SupabaseClientType;
  alignmentId: string;
  round: number;
  userId: string;
  reviewedSnapshotHash: string;
}): Promise<AgreementSnapshotView>;
```

9. `buildAgreementSnapshotPreview` must derive everything from server-side database state:
   - `alignments`, `alignment_participants`, `profiles`, `alignment_responses`, `alignment_analyses`, `templates`, and `document-skeleton`.
   - Do not accept `finalPositions`, `participants`, or `summary` from the browser.
   - Build `final_positions` from `analysis.summary.agreements` using the existing `term_${index + 1}` mapping.
   - Build summary points from the first five `analysis.summary.agreements[*].description`, with the existing fallback text.
   - Include `document.html` in the hash input.

10. `getOrCreateFrozenAgreementSnapshot` must create the row only during the first successful sign attempt:
   - If a frozen row already exists and `reviewedSnapshotHash !== row.snapshot_hash`, throw `AlignmentError('This agreement was updated after you opened the page. Refresh and review the current document before signing.', 'DOCUMENT_REVIEW_REQUIRED', 409, { reviewedSnapshotHash, currentSnapshotHash: row.snapshot_hash, refreshUrl })`.
   - If no frozen row exists, build the preview. If `reviewedSnapshotHash !== preview.hash`, throw the same `DOCUMENT_REVIEW_REQUIRED`.
   - Insert into `alignment_agreement_snapshots`.
   - If the insert loses the unique `(alignment_id, round)` race, fetch the winning row. If its hash differs from `reviewedSnapshotHash`, throw `DOCUMENT_REVIEW_REQUIRED`; otherwise return it.

Risk:

Existing signature rows cannot be backfilled into fully trustworthy frozen documents because the app never persisted the displayed HTML. Leave the new signature columns nullable for legacy rows, but block any new signature for a partially signed legacy round until both participants re-review a fresh frozen artifact or the round is explicitly restarted.

### P0 Add a shared readiness gate

Files:

- `app/lib/db-helpers.ts`
- `app/alignment/[id]/document/page.tsx`
- `app/api/alignment/[id]/sign/route.ts`
- `app/api/alignment/generate-document/route.ts`

Plan:

1. Add this helper to `app/lib/db-helpers.ts`:

```ts
export interface DocumentReadiness {
  alignment: Database['public']['Tables']['alignments']['Row'];
  analysis: Database['public']['Tables']['alignment_analyses']['Row'];
  round: number;
  conflictCount: 0;
}

export async function assertReadyForDocument(
  supabase: SupabaseClientType,
  alignmentId: string,
  userId: string,
  requestedRound?: number
): Promise<DocumentReadiness> {
  const { data: participant } = await supabase
    .from('alignment_participants')
    .select('id')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .single();

  if (!participant) {
    throw new AlignmentError('Not authorized to view this alignment', 'ALIGNMENT_UNAUTHORIZED', 403, {
      alignmentId,
      userId,
    });
  }

  const { data: alignment, error: alignmentError } = await supabase
    .from('alignments')
    .select('*')
    .eq('id', alignmentId)
    .single();

  if (alignmentError || !alignment) {
    throw new AlignmentError('Alignment not found', 'ALIGNMENT_NOT_FOUND', 404, { alignmentId });
  }

  const round = requestedRound ?? alignment.current_round;
  if (round !== alignment.current_round) {
    throw new AlignmentError('Document is not ready for this round', 'ROUND_MISMATCH', 409, {
      currentRound: alignment.current_round,
      requestedRound: round,
    });
  }

  if (alignment.status !== 'resolving' && alignment.status !== 'complete') {
    throw new AlignmentError('Agreement document is not ready yet', 'DOCUMENT_NOT_READY', 409, {
      status: alignment.status,
      alignmentId,
      round,
    });
  }

  const { data: analysis, error: analysisError } = await supabase
    .from('alignment_analyses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .single();

  if (analysisError || !analysis || !analysis.summary) {
    throw new AlignmentError('Latest analysis is required before signing', 'DOCUMENT_ANALYSIS_MISSING', 409, {
      alignmentId,
      round,
    });
  }

  const conflicts = Array.isArray((analysis.summary as any).conflicts)
    ? (analysis.summary as any).conflicts
    : [];

  if (conflicts.length > 0) {
    throw new AlignmentError('Resolve all conflicts before signing the agreement', 'DOCUMENT_CONFLICTS_REMAIN', 409, {
      alignmentId,
      round,
      conflictCount: conflicts.length,
      resolutionUrl: `/alignment/${alignmentId}/resolution`,
    });
  }

  return { alignment, analysis, round, conflictCount: 0 as const };
}
```

2. In `document/page.tsx`, call `assertReadyForDocument(supabase, id, user.id)` before rendering the document.
   - `DOCUMENT_CONFLICTS_REMAIN` redirects to `/alignment/${id}/resolution`.
   - `DOCUMENT_ANALYSIS_MISSING` redirects to `/alignment/${id}/analysis`.
   - `DOCUMENT_NOT_READY` keeps the existing status switch for `draft`, `active`, and `analyzing`.

3. In `sign/route.ts`, call the same helper after authentication and before snapshot loading/insertion.

4. In `generate-document/route.ts`, call the same helper and return a 409 for unresolved documents. This route should no longer let a client manufacture a signable-looking document by posting arbitrary `finalPositions`.

Risk:

Manual `/alignment/:id/document` access becomes stricter. That is the intended fix: the URL should be a server-authoritative gate, not a client-navigation convention.

### P0 Render server-owned document bytes and require hash review

Files:

- `app/alignment/[id]/document/page.tsx`
- `app/alignment/[id]/document/components/document-content.tsx`
- `app/alignment/[id]/document/components/signature-section.tsx`
- `app/api/alignment/generate-document/route.ts`
- `app/lib/agreement-snapshots.ts`

Plan:

1. Change `document/page.tsx` to load a frozen snapshot if one exists; otherwise build a server-side preview without writing it:

```ts
const frozenSnapshot = await loadFrozenAgreementSnapshot(
  supabase,
  alignment.id,
  alignment.current_round
);

const agreementSnapshot = frozenSnapshot ?? await buildAgreementSnapshotPreview(
  supabase,
  alignment.id,
  alignment.current_round
);
```

2. Stop passing `alignmentId`, `templateId`, `participants`, `dateFinalized`, and `analysis` into `DocumentContent`. Pass only server-owned HTML and snapshot metadata:

```tsx
<div id="alignment-document-export" className="space-y-8">
  <DocumentContent
    documentHtml={agreementSnapshot.documentHtml}
    snapshotHash={agreementSnapshot.hash}
    isFrozen={agreementSnapshot.isFrozen}
  />

  <SignatureSection
    alignmentId={alignment.id}
    round={alignment.current_round}
    reviewedSnapshotHash={agreementSnapshot.hash}
    currentUserId={user.id}
    participants={signatureParticipants}
    allSigned={allSigned}
  />
</div>
```

3. Replace `DocumentContentProps` with:

```ts
interface DocumentContentProps {
  documentHtml: string;
  snapshotHash: string;
  isFrozen: boolean;
}
```

4. Remove the `useEffect`, `fetch('/api/alignment/generate-document')`, loading state, and client-side `finalPositions` construction from `DocumentContent`.

5. Keep DOMPurify as a defensive client-side pass, but it should receive the already sanitized/persisted server HTML.

6. Change `SignatureSection` to render deterministic participant rows, not viewer-relative "Participant A: current user" / "Participant B: partner" rows:

```ts
interface SignatureParticipantView {
  userId: string;
  displayName: string;
  role: 'owner' | 'partner';
  signature: {
    id: string;
    created_at: string;
    agreement_snapshot_hash: string | null;
  } | null;
}

interface SignatureSectionProps {
  alignmentId: string;
  round: number;
  reviewedSnapshotHash: string;
  currentUserId: string;
  participants: SignatureParticipantView[];
  allSigned: boolean;
}
```

7. `SignatureSection` must POST:

```ts
body: JSON.stringify({
  round,
  reviewedSnapshotHash,
})
```

8. If the sign API returns `DOCUMENT_REVIEW_REQUIRED`, clear the checkbox, show "This agreement changed after you opened the page. Review the refreshed document before signing.", call `router.refresh()`, and require the user to check the consent box again.

9. Change `/api/alignment/generate-document` into a server-derived preview/frozen document endpoint:

```ts
const GenerateDocumentRequestSchema = z.object({
  alignmentId: z.string().uuid(),
  round: z.number().int().positive().optional(),
});

interface GenerateDocumentResponse {
  data: {
    documentHtml: string;
    sections: DocumentSection[];
    snapshotHash: string;
    snapshotId: string | null;
    isFrozen: boolean;
  };
}
```

10. The route should call `assertReadyForDocument`, then return `loadFrozenAgreementSnapshot(...) ?? buildAgreementSnapshotPreview(...)`. It should not persist a snapshot and should not accept `templateId`, `finalPositions`, `participants`, or `summary` from the request body.

Risk:

The first signer no longer signs "whatever the browser just generated"; they sign a server-built preview hash. If the underlying prompt/template/analysis changes between page load and click, the request is rejected and the signer must re-review. That is the right friction for a signing boundary.

### P0 Make signing idempotent and transition-owned

Files:

- `app/api/alignment/[id]/sign/route.ts`
- `app/lib/db-helpers.ts`
- `app/lib/agreement-snapshots.ts`

Plan:

1. Update the sign request/response shapes:

```ts
const SignRequestSchema = z.object({
  round: z.number().int().positive(),
  reviewedSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
});

interface SignResponse {
  data: {
    signatureId: string;
    allSigned: boolean;
    alignmentStatus: AlignmentStatus;
    snapshotId: string;
    snapshotHash: string;
    idempotent: boolean;
  };
}
```

2. Add a direct helper for conditional completion:

```ts
export async function completeAlignmentIfResolving(
  supabase: SupabaseClientType,
  alignmentId: string
): Promise<QueryResult<Alignment>> {
  const { data, error } = await supabase
    .from('alignments')
    .update({ status: 'complete' })
    .eq('id', alignmentId)
    .eq('status', 'resolving')
    .select()
    .maybeSingle();

  return { data: data as Alignment | null, error };
}
```

3. Replace the route flow with:
   - Authenticate.
   - Parse `{ round, reviewedSnapshotHash }`.
   - Validate participant.
   - Call `assertReadyForDocument`.
   - Reject non-current rounds.
   - Check for an existing signature for `(alignment_id, user_id, round)`. If present, return the existing row as `idempotent: true` after recomputing `allSigned`; do not throw "already signed".
   - Call `getOrCreateFrozenAgreementSnapshot`.
   - Generate `signature = sha256(`${user.id}:${Date.now()}:${snapshot.hash}`)`.
   - Insert the signature with `canonical_snapshot: snapshot.snapshot`, `agreement_snapshot_id: snapshot.id`, and `agreement_snapshot_hash: snapshot.hash`.
   - If insert fails with Postgres `23505`, fetch the existing signature and return it as `idempotent: true`.
   - Any other insert error remains a real failure.

4. Compute `allSigned` only from signatures for the current round that reference the frozen hash:

```ts
const signedUserIds = new Set(
  signatures
    .filter((s) => s.round === round && s.agreement_snapshot_hash === snapshot.hash)
    .map((s) => s.user_id)
);

const allSigned =
  participantIds.size > 0 &&
  participantIds.size === signedUserIds.size &&
  Array.from(participantIds).every((id) => signedUserIds.has(id));
```

5. Complete the alignment only with the conditional helper:

```ts
let didComplete = false;
let finalStatus = alignment.status as AlignmentStatus;

if (allSigned) {
  const { data: completed, error: completeError } =
    await completeAlignmentIfResolving(supabase, alignmentId);

  if (completeError) throw completeError;

  if (completed) {
    didComplete = true;
    finalStatus = 'complete';
  } else {
    finalStatus = 'complete';
  }
}
```

6. Send completion emails only when `didComplete === true`.

7. If an idempotent retry finds all signatures present but the original request died before the status update, it may perform the conditional transition and send email. That is acceptable because the email is still tied to the single successful transition.

Risk:

This intentionally changes duplicate signing from a validation error into a successful replay. Client code should treat `idempotent: true` as success and refresh the page.

### P1 Export the document plus signatures

Files:

- `app/alignment/[id]/document/page.tsx`
- `app/alignment/[id]/document/components/document-actions.tsx`
- `app/alignment/[id]/document/components/signature-section.tsx`

Plan:

1. Wrap the rendered document and deterministic signature section in one export node:

```tsx
<div id="alignment-document-export" className="space-y-8">
  <DocumentContent ... />
  <SignatureSection ... />
</div>

{allSigned && (
  <DocumentActions
    alignmentId={alignment.id}
    alignmentTitle={alignment.title || 'Alignment Agreement'}
    exportElementId="alignment-document-export"
  />
)}
```

2. Update `DocumentActionsProps`:

```ts
interface DocumentActionsProps {
  alignmentId: string;
  alignmentTitle: string;
  exportElementId?: string;
}
```

3. Change `handleDownload` to use:

```ts
const content = document.getElementById(exportElementId ?? 'alignment-document-export');
```

4. Keep the actions themselves outside the export wrapper so the PDF includes document body and signatures, not the download/share buttons.

5. Add print-friendly classes to `SignatureSection` so signer rows avoid page breaks:

```css
@media print {
  .signature-participant-row {
    page-break-inside: avoid;
  }
}
```

Risk:

The PDF remains client-generated through `html2pdf.js`, so exact typography can vary by browser. The integrity fix here is that the exported DOM includes the executed signature section; server-side PDF generation can be a later hardening pass.

### P2 Verify the repair

Files:

- `app/lib/agreement-snapshots.ts`
- `app/lib/agreement-document.ts`
- `app/api/alignment/[id]/sign/route.ts`
- `app/alignment/[id]/document/components/document-actions.tsx`

Plan:

1. Run the repo's existing checks:

```bash
npm run type-check
npm run build
```

2. Add focused tests if the implementer has time to wire them cleanly:
   - `stableStringify` sorts object keys recursively.
   - Snapshot hash excludes `hash` and `frozen_at`.
   - Participant ordering is deterministic and not viewer-relative.
   - Same DB fixture produces the same `snapshotHash` and `documentHtml`.
   - `getOrCreateFrozenAgreementSnapshot` rejects stale `reviewedSnapshotHash`.

3. Manual regression cases:
   - Resolving alignment with nonzero `analysis.summary.conflicts` redirects away from `/alignment/:id/document`.
   - Same unresolved alignment gets 409 `DOCUMENT_CONFLICTS_REMAIN` from `POST /api/alignment/:id/sign`.
   - First signer sees server-provided document HTML and signs with `reviewedSnapshotHash`.
   - First signature creates exactly one `alignment_agreement_snapshots` row for `(alignment_id, round)`.
   - Second signer sees the persisted frozen HTML and signs the same `snapshotHash`.
   - A stale page with an old `reviewedSnapshotHash` receives 409 `DOCUMENT_REVIEW_REQUIRED` and creates no signature.
   - Double POST from the same signer returns 200 with the same `signatureId` and `idempotent: true`.
   - Concurrent final signatures send completion emails only from the request whose conditional `resolving -> complete` update returns a row.
   - Downloaded PDF includes "Digital Signatures", both signer names, and both signature timestamps.

Risk:

The repo has `type-check` and `build` scripts, but no obvious first-class unit or E2E suite. Keep automated coverage focused on pure snapshot/document helpers unless there is time to add route-level tests without introducing a broad test stack.
