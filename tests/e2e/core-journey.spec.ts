import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// The core two-partner journey, end to end: create, invite, join, answer,
// analyze, resolve a conflict, analyze again, sign by both people, then
// download the signed PDF.
// Uses made-up accounts on the local Supabase stack from `npm run test:e2e`.
// E2E_REAL_MODEL=1 calls OpenRouter. CI leaves that unset and uses the stub.

const realModel = process.env.E2E_REAL_MODEL === '1';
const reportTimeout = realModel ? 180_000 : 60_000;
const RESOLUTION =
  'EQUAL_OWNERSHIP_COMPROMISE: we split ownership equally, decide major questions together, and divide profit equally.';

const runId = randomBytes(4).toString('hex');
const password = randomBytes(18).toString('base64url');
const creator = { email: `creator-${runId}@example.test`, name: 'E2E Creator' };
const partner = { email: `partner-${runId}@example.test`, name: 'E2E Partner' };

let inviteUrl = '';

const admin = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function createAccount(account: { email: string; name: string }) {
  const { error } = await admin.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: account.name },
  });
  if (error) throw error;
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: /^log in$/i }).click();
  await page.waitForURL(/\/dashboard/);
}

// The clarity sections are collapsed accordions; open one before filling it.
async function openSection(page: Page, summary: string, field: string) {
  if (!(await page.locator(field).isVisible())) {
    await page.getByText(summary, { exact: true }).click();
  }
  await expect(page.locator(field)).toBeVisible();
}

function alignmentIdFrom(url: string): string {
  const match = url.match(/\/alignment\/([0-9a-f-]{36})/);
  if (!match) throw new Error(`No alignment id in ${url}`);
  return match[1];
}

function pdfPageCount(bytes: Buffer): number {
  const text = bytes.toString('latin1');
  const counts = [...text.matchAll(/\/Type\s*\/Pages\b[\s\S]{0,300}?\/Count\s+(\d+)/g)].map((match) =>
    Number(match[1]),
  );
  if (counts.length > 0) return Math.max(...counts);
  const pages = text.match(/\/Type\s*\/Page\b(?!s)/g);
  return pages?.length ?? 0;
}

async function shot(page: Page, name: string) {
  if (!realModel) return;
  await mkdir('/opt/cursor/artifacts', { recursive: true });
  await page.screenshot({ path: `/opt/cursor/artifacts/${name}.png`, fullPage: true });
}

async function answerQuestionnaire(page: Page, alignmentId: string, stance: 'creator' | 'partner') {
  const text =
    stance === 'creator'
      ? 'I want equal 50/50 ownership, shared decisions on every major choice, and an equal split of profit.'
      : 'I want an 80/20 ownership split in my favor, sole authority on major decisions, and most of the profit.';

  for (let step = 0; step < 30; step += 1) {
    const textarea = page.locator('textarea:visible').first();
    if (await textarea.count()) {
      await textarea.fill(`${text} This is answer ${step + 1}, written independently.`);
    }
    const textInput = page.locator('input[type="text"]:visible').first();
    if (await textInput.count()) {
      await textInput.fill(text);
    }
    const numberInput = page.locator('input[type="number"]:visible').first();
    if (await numberInput.count()) {
      await numberInput.fill(stance === 'creator' ? '50' : '80');
    }
    const radios = page.getByRole('radio');
    const radioCount = await radios.count();
    if (radioCount > 0) {
      await (stance === 'creator' ? radios.first() : radios.nth(radioCount - 1)).check();
    }
    const boxes = page.getByRole('checkbox');
    const boxCount = await boxes.count();
    if (boxCount > 0) {
      await (stance === 'creator' ? boxes.first() : boxes.nth(boxCount - 1)).check();
    }
    const slider = page.getByRole('slider');
    if (await slider.count()) {
      await slider.first().focus();
      if (stance === 'creator') {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
      } else {
        for (let nudge = 0; nudge < 12; nudge += 1) {
          await page.keyboard.press('ArrowRight');
        }
      }
    }

    const submit = page.getByRole('button', { name: /submit responses/i });
    if (await submit.isVisible()) {
      await submit.click();
      break;
    }
    await page.getByRole('button', { name: /^next$/i }).click();
  }

  await page.waitForURL(new RegExp(`/alignment/${alignmentId}/waiting$`));
}

async function resolveConflicts(page: Page) {
  await expect(page.getByRole('heading', { name: 'Resolve Conflicts' })).toBeVisible();
  for (let index = 0; index < 15; index += 1) {
    const progress = page.getByText(/Conflict \d+ of \d+/);
    await expect(progress).toBeVisible();
    const label = (await progress.textContent()) ?? '';
    const match = label.match(/Conflict (\d+) of (\d+)/);
    const current = Number(match?.[1] ?? 1);
    const total = Number(match?.[2] ?? 1);

    await page.getByRole('radio', { name: /Propose Custom Solution/i }).check();
    await page.getByPlaceholder(/research three options/i).fill(RESOLUTION);

    if (current < total) {
      await page.getByRole('button', { name: /^next$/i }).click();
      await expect(page.getByText(new RegExp(`Conflict ${current + 1} of ${total}`))).toBeVisible();
      continue;
    }
    break;
  }

  await page.getByRole('button', { name: /^submit resolutions$/i }).click();
}

async function waitForReport(page: Page): Promise<'conflicts' | 'document'> {
  await expect
    .poll(
      async () => {
        if (await page.getByRole('link', { name: /resolve conflicts/i }).isVisible()) return 'conflicts';
        if (await page.getByRole('link', { name: /generate final document/i }).isVisible()) return 'document';
        const viewReport = page.getByRole('button', { name: /view report/i });
        if (await viewReport.isVisible()) await viewReport.click();
        return '';
      },
      { timeout: reportTimeout },
    )
    .not.toBe('');

  if (await page.getByRole('link', { name: /generate final document/i }).isVisible()) return 'document';
  return 'conflicts';
}

test('invite, join, answer, resolve a conflict, sign and PDF', async ({ browser }) => {
  test.setTimeout(realModel ? 900_000 : 240_000);
  await createAccount(creator);
  await createAccount(partner);

  const creatorContext = await browser.newContext();
  const partnerContext = await browser.newContext();
  const creatorPage = await creatorContext.newPage();
  const partnerPage = await partnerContext.newPage();

  let alignmentId = '';
  let reportPage = creatorPage;

  await test.step('creator starts an alignment from a template', async () => {
    await signIn(creatorPage, creator.email);
    await creatorPage.goto('/alignment/new');
    await creatorPage.getByText('Partnership Terms', { exact: true }).click();
    await creatorPage.waitForURL(/\/clarity(\?|$)/);
    alignmentId = alignmentIdFrom(creatorPage.url());
    console.log(`E2E_ALIGNMENT_ID=${alignmentId}`);

    await creatorPage.locator('#topic').fill('Terms for bringing a new partner into our studio');
    await openSection(creatorPage, 'Who are you aligning with?', '#partner');
    await creatorPage.locator('#partner').fill(partner.name);
    await openSection(creatorPage, 'What does success look like?', '#outcome');
    await creatorPage.locator('#outcome').fill('A clear split of pay, ownership, and client work we both agree to');
  });

  await test.step('creator creates a share link', async () => {
    // Only the clarity page offers Generate Link; Continue leaves it for good.
    const invite = creatorPage.waitForResponse(
      (res) => res.url().includes(`/api/alignment/${alignmentId}/generate-invite`) && res.request().method() === 'POST',
    );
    await creatorPage.getByRole('button', { name: /generate link/i }).click();
    const body = await (await invite).json();
    inviteUrl = body.invite_url;
    expect(inviteUrl).toMatch(/\/join\/[A-Za-z0-9_-]+$/);

    await creatorPage.getByRole('button', { name: /^continue$/i }).click();
    await creatorPage.waitForURL(new RegExp(`/alignment/${alignmentId}/questions$`));
  });

  await test.step('partner joins through the invite link', async () => {
    await signIn(partnerPage, partner.email);
    await partnerPage.goto(inviteUrl);
    await partnerPage.getByRole('button', { name: /join alignment/i }).click();
    await partnerPage.waitForURL(new RegExp(`/alignment/${alignmentId}/questions$`));
  });

  await test.step('both people answer independently', async () => {
    await answerQuestionnaire(creatorPage, alignmentId, 'creator');
    await answerQuestionnaire(partnerPage, alignmentId, 'partner');
  });

  await test.step('analysis finds a conflict and both partners resolve it', async () => {
    const maxPasses = realModel ? 3 : 2;
    let sawConflict = false;
    let clean = false;

    for (let pass = 0; pass < maxPasses && !clean; pass += 1) {
      if (pass === 0) {
        const analyzed = creatorPage.waitForResponse(
          (res) => res.url().includes('/api/alignment/analyze') && res.request().method() === 'POST',
        );
        await creatorPage.goto(`/alignment/${alignmentId}/analysis`);
        expect((await analyzed).status()).toBe(200);
        reportPage = creatorPage;
      } else {
        await partnerPage.waitForURL(new RegExp(`/alignment/${alignmentId}/analysis`), { timeout: reportTimeout });
        reportPage = partnerPage;
      }

      const outcome = await waitForReport(reportPage);
      if (outcome === 'document') {
        clean = true;
        break;
      }

      sawConflict = true;
      if (!realModel) {
        await expect(reportPage.getByRole('heading', { name: 'Ownership split' })).toBeVisible();
      }
      await shot(reportPage, `acceptance-conflict-round-${pass + 1}`);
      if (pass === maxPasses - 1) break;

      await creatorPage.goto(`/alignment/${alignmentId}/resolution`);
      await partnerPage.goto(`/alignment/${alignmentId}/resolution`);
      if (!realModel) {
        await expect(creatorPage.getByText('The two of you disagree on how to split ownership.')).toBeVisible();
        await expect(creatorPage.getByText('AI Compromise', { exact: true })).toBeVisible();
      }
      await resolveConflicts(creatorPage);
      await expect(creatorPage.getByRole('heading', { name: /waiting for/i })).toBeVisible({ timeout: 30_000 });
      await shot(creatorPage, `acceptance-waiting-round-${pass + 1}`);
      await resolveConflicts(partnerPage);
    }

    expect(sawConflict).toBe(true);
    expect(clean).toBe(true);
    await expect(reportPage.getByRole('link', { name: /generate final document/i })).toBeVisible({
      timeout: reportTimeout,
    });
    await shot(reportPage, 'acceptance-clean-report');
  });

  await test.step('creator signs the agreement', async () => {
    await creatorPage.goto(`/alignment/${alignmentId}/document`);
    await creatorPage.waitForURL(new RegExp(`/alignment/${alignmentId}/document$`));
    await creatorPage.getByRole('checkbox').check();
    await creatorPage.getByRole('button', { name: /^confirm signature$/i }).click();
    await expect(creatorPage.getByText('Signature confirmed').first()).toBeVisible();
    await shot(creatorPage, 'acceptance-creator-signed');
  });

  await test.step('partner signs the identical snapshot', async () => {
    await partnerPage.goto(`/alignment/${alignmentId}/document`);
    await partnerPage.getByRole('checkbox').check();
    await partnerPage.getByRole('button', { name: /^confirm signature$/i }).click();
    await expect(partnerPage.getByRole('button', { name: /download agreement/i })).toBeVisible();
    await shot(partnerPage, 'acceptance-both-signed');
  });

  let pdfPages = 0;

  await test.step('signed PDF downloads', async () => {
    await creatorPage.reload();
    const download = creatorPage.waitForEvent('download');
    await creatorPage.getByRole('button', { name: /download agreement/i }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
    const saved = await file.path();
    const bytes = await readFile(saved!);
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(bytes.length).toBeGreaterThan(5_000);
    pdfPages = pdfPageCount(bytes);
    expect(pdfPages).toBeGreaterThanOrEqual(2);
    if (realModel) {
      await mkdir('/opt/cursor/artifacts', { recursive: true });
      await writeFile('/opt/cursor/artifacts/acceptance-agreement.pdf', bytes);
    }
  });

  await test.step('database records a complete, twice-signed alignment', async () => {
    const { data: row, error } = await admin.from('alignments').select('status, current_round').eq('id', alignmentId).single();
    expect(error).toBeNull();
    expect(row?.status).toBe('complete');

    const { data: analyses, error: analysesError } = await admin
      .from('alignment_analyses')
      .select('round, summary')
      .eq('alignment_id', alignmentId)
      .order('round', { ascending: true });
    expect(analysesError).toBeNull();
    const rounds = (analyses ?? []).map((analysis) => {
      const summary = analysis.summary as { alignment_score?: number; conflicts?: unknown[] } | null;
      return {
        round: analysis.round,
        score: summary?.alignment_score ?? null,
        conflicts: Array.isArray(summary?.conflicts) ? summary.conflicts.length : 0,
      };
    });
    expect(rounds.length).toBeGreaterThanOrEqual(2);
    expect(rounds.some((round) => round.conflicts > 0)).toBe(true);
    expect(rounds[rounds.length - 1]?.conflicts).toBe(0);

    const { data: signatures, error: signaturesError } = await admin
      .from('alignment_signatures')
      .select('agreement_snapshot_hash')
      .eq('alignment_id', alignmentId);
    expect(signaturesError).toBeNull();
    expect(signatures).toHaveLength(2);
    const hashes = new Set(signatures!.map((signature) => signature.agreement_snapshot_hash));
    expect(hashes.size).toBe(1);
    expect([...hashes][0]).toBeTruthy();

    const evidence = {
      alignmentId,
      realModel,
      status: row?.status,
      rounds,
      pdfPages,
      snapshotHash: [...hashes][0],
    };
    console.log(`E2E_EVIDENCE=${JSON.stringify(evidence)}`);
    if (realModel) {
      await mkdir('/opt/cursor/artifacts', { recursive: true });
      await writeFile('/opt/cursor/artifacts/acceptance-run.json', JSON.stringify(evidence, null, 2));
    }
  });

  await creatorContext.close();
  await partnerContext.close();
});
