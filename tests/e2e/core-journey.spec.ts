import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// The core two-partner journey, end to end: create, invite, join, answer,
// analyze, sign by both people, then download the signed PDF.
// Uses made-up accounts on the local Supabase stack from `npm run test:e2e`.

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

test('invite, join, answer, analyze, sign and PDF', async ({ browser }) => {
  test.setTimeout(240_000);
  await createAccount(creator);
  await createAccount(partner);

  const creatorContext = await browser.newContext();
  const partnerContext = await browser.newContext();
  const creatorPage = await creatorContext.newPage();
  const partnerPage = await partnerContext.newPage();

  let alignmentId = '';

  await test.step('creator starts an alignment from a template', async () => {
    await signIn(creatorPage, creator.email);
    await creatorPage.goto('/alignment/new');
    await creatorPage.getByText('Partnership Terms', { exact: true }).click();
    await creatorPage.waitForURL(/\/clarity(\?|$)/);
    alignmentId = alignmentIdFrom(creatorPage.url());

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
    for (const [page, who] of [
      [creatorPage, 'Creator'],
      [partnerPage, 'Partner'],
    ] as const) {
      await page.goto(`/alignment/${alignmentId}/questions`);
      for (let step = 0; step < 20; step += 1) {
        const field = page.locator('textarea:visible').first();
        if (await field.count()) {
          await field.fill(`${who} answer for question ${step + 1}, written independently.`);
        }
        const submit = page.getByRole('button', { name: /^submit responses$/i });
        if (await submit.isVisible()) {
          await submit.click();
          break;
        }
        await page.getByRole('button', { name: /^next$/i }).click();
      }
      await page.waitForURL(new RegExp(`/alignment/${alignmentId}/waiting$`));
    }
  });

  await test.step('analysis runs and reports no conflicts', async () => {
    const analyzed = creatorPage.waitForResponse(
      (res) => res.url().includes('/api/alignment/analyze') && res.request().method() === 'POST',
    );
    await creatorPage.goto(`/alignment/${alignmentId}/analysis`);
    expect((await analyzed).status()).toBe(200);
    await expect(creatorPage.getByRole('link', { name: /generate final document/i })).toBeVisible({
      timeout: 60_000,
    });
  });

  await test.step('creator signs the agreement', async () => {
    await creatorPage.getByRole('link', { name: /generate final document/i }).click();
    await creatorPage.waitForURL(new RegExp(`/alignment/${alignmentId}/document$`));
    await creatorPage.getByRole('checkbox').check();
    await creatorPage.getByRole('button', { name: /^confirm signature$/i }).click();
    await expect(creatorPage.getByText('Signature confirmed').first()).toBeVisible();
  });

  await test.step('partner signs the identical snapshot', async () => {
    await partnerPage.goto(`/alignment/${alignmentId}/document`);
    await partnerPage.getByRole('checkbox').check();
    await partnerPage.getByRole('button', { name: /^confirm signature$/i }).click();
    await expect(partnerPage.getByRole('button', { name: /download agreement/i })).toBeVisible();
  });

  await test.step('signed PDF downloads', async () => {
    await creatorPage.reload();
    const download = creatorPage.waitForEvent('download');
    await creatorPage.getByRole('button', { name: /download agreement/i }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
    const bytes = await readFile((await file.path())!);
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(bytes.length).toBeGreaterThan(5_000);
  });

  await test.step('database records a complete, twice-signed alignment', async () => {
    const { data: row, error } = await admin.from('alignments').select('status').eq('id', alignmentId).single();
    expect(error).toBeNull();
    expect(row?.status).toBe('complete');
    const { data: signatures, error: signaturesError } = await admin
      .from('alignment_signatures')
      .select('agreement_snapshot_hash')
      .eq('alignment_id', alignmentId);
    expect(signaturesError).toBeNull();
    expect(signatures).toHaveLength(2);
    // Both signatures must be over the same agreement snapshot.
    const hashes = new Set(signatures!.map((s) => s.agreement_snapshot_hash));
    expect(hashes.size).toBe(1);
    expect([...hashes][0]).toBeTruthy();
  });

  await creatorContext.close();
  await partnerContext.close();
});
