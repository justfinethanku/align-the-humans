/**
 * Browser PDF export helpers for the completed agreement.
 *
 * html2pdf's `before` rule inserts a spacer of
 * `pageHeight - (top % pageHeight)` in front of `.document-disclaimer`.
 * When the disclaimer is already at the top of a page, that remainder is a
 * full extra page, which is the blank page between the last term and the
 * signature block. A spacer that tall is dropped after html2pdf lays the
 * pages out. Smaller spacers still push the disclaimer onto the next page
 * so it is not sliced.
 *
 * html2pdf does not honor `break-after: avoid`, so the "Detailed Terms"
 * heading is grouped with the first `.term`. The group's `break-inside:
 * avoid` moves them together when they fit on one page. A term taller than
 * a page is unchanged: html2pdf only avoids a break inside an element that
 * is at most one page tall, and the term's own avoid rule still applies.
 */

export const DISCLAIMER_PAD_SLACK_PX = 64;

export const agreementPdfPagebreak = {
  mode: ['css', 'legacy'] as ['css', 'legacy'],
  before: ['.document-disclaimer'],
  avoid: [
    'h1',
    'h2',
    'h3',
    'tr',
    '.term',
    '.term-heading-keep',
    '.signature-participant-row',
    '.document-disclaimer',
    '.document-footer',
    '.document-meta',
  ],
};

export function isFullPageDisclaimerPad(heightPx: number, pageHeightPx: number): boolean {
  return Number.isFinite(heightPx)
    && Number.isFinite(pageHeightPx)
    && pageHeightPx > 0
    && heightPx > pageHeightPx - DISCLAIMER_PAD_SLACK_PX;
}

/**
 * Wrap each h2 that is followed by a term with that term. Frozen agreement
 * HTML already uses this shape, so the export does not depend on a new
 * document skeleton.
 */
export function keepDetailedTermsHeadingWithFirstTerm(root: ParentNode): void {
  const headings = root.querySelectorAll('h2');
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (heading.parentElement?.classList.contains('term-heading-keep')) {
      continue;
    }
    const next = heading.nextElementSibling;
    if (!next?.classList.contains('term')) {
      continue;
    }
    const doc = heading.ownerDocument;
    const parent = heading.parentElement;
    if (!doc || !parent) {
      continue;
    }
    const group = doc.createElement('div');
    group.className = 'term-heading-keep';
    parent.insertBefore(group, heading);
    group.append(heading, next);
  }
}

export function prepareAgreementExportElement(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  keepDetailedTermsHeadingWithFirstTerm(clone);
  return clone;
}

function spacerHeight(element: Element): number {
  if (!('style' in element)) {
    return Number.NaN;
  }
  return parseFloat((element as HTMLElement).style.height);
}

/**
 * Drop the blank-page spacer html2pdf inserted immediately before the
 * disclaimer. Returns true when a spacer was removed.
 */
export function removeFullPageDisclaimerPad(container: ParentNode, pageHeightPx: number): boolean {
  const disclaimer = container.querySelector('.document-disclaimer');
  const pad = disclaimer?.previousElementSibling;
  if (!pad || pad.childElementCount !== 0) {
    return false;
  }
  const height = spacerHeight(pad);
  if (!isFullPageDisclaimerPad(height, pageHeightPx)) {
    return false;
  }
  pad.remove();
  return true;
}
