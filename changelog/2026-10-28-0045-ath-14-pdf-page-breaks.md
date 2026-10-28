# ATH-14: Agreement PDF blank page and orphaned heading

**Keywords:** [PDF] [PAGINATION] [JSPDF] [HTML2PDF] [ATH-14] [ATH-28]
**Session:** 2026-10-28, after midnight UTC
**Commit:** this branch

## What Changed
- Agreement PDF export drops the full-page spacer html2pdf inserts before `.document-disclaimer` when that disclaimer is already at the top of a page.
- The "Detailed Terms" heading is grouped with the first term before export, and that group avoids a page break inside it.
- The client imports `html2pdf.js/src/index.js` and depends on `jspdf` 4.2.1 directly. The published html2pdf bundle embeds jsPDF 4.0.0.
- `docs/testing-runbook.md` records the October 27, 2026 production page check and how to retest.

## Why
Production exports of a 5-page agreement and a 3-page agreement each contained a blank page between the last term and the disclaimer. The 5-page file also left "Detailed Terms" alone at the bottom of page 1. Terms themselves were not split. The PDF Producer string was jsPDF 4.0.0, so the ATH-28 lockfile bump was not the copy that generated the file.

## How It Was Done
html2pdf's `before` rule pads by `pageHeight - (top % pageHeight)`. A disclaimer already within 64px of the top of a page produces a spacer almost a full page tall. After `toContainer()`, that spacer is removed. Shorter spacers stay, so the disclaimer is still pushed off a page it would otherwise be sliced across.

html2pdf ignores `break-after: avoid`. The export clones the agreement and wraps the detailed-terms `h2` with the following `.term`. The wrapper is in the avoid list and has `break-inside: avoid`.

## Issues Encountered
Removing the forced disclaimer break entirely cleared the blank page and then split the signature card, leaving "Digital Signatures" on the terms page. Keeping the break and deleting only the full-page spacer avoids that.

## Dependencies
`jspdf` 4.2.1 is now a direct dependency. html2pdf.js stays at 0.14.0. Its dist file still contains jsPDF 4.0.0; the app does not import that file.

## Testing Notes
Unit tests cover the heading group and which spacers are removed. A headless Chrome run of the same html2pdf page-break options reproduced a blank page (spacer of 944px on a 960px page) and an orphaned "Detailed Terms" heading, then confirmed both were gone. The source bundle's Producer string is jsPDF 4.2.1.

## Next Steps
ATH-32 is still the signed-in journey and a live model call. Selectable PDF text remains ATH-25.

## Impact Assessment
Completed agreements download without a blank page. A heading that used to sit alone at the bottom of a page moves with Term 1 when the pair fits on one page. The PDF library that runs in the browser is the patched jsPDF.

## Lessons Learned
`npm ls jspdf` can show 4.2.1 while the file the browser executes is the copy webpack already baked into `html2pdf.js/dist/html2pdf.js`.
