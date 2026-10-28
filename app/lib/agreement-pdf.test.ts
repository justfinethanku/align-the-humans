/// <reference path="./jsdom.d.ts" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import {
  agreementPdfPagebreak,
  isFullPageDisclaimerPad,
  keepDetailedTermsHeadingWithFirstTerm,
  prepareAgreementExportElement,
  removeFullPageDisclaimerPad,
} from './agreement-pdf';

const AGREEMENT_HTML = `
  <div id="alignment-document-export">
    <div class="document-content">
      <section class="executive-summary">
        <h2>Executive Summary</h2>
        <ul><li>Guests are welcome.</li></ul>
      </section>
      <section class="detailed-terms">
        <h2>Detailed Terms</h2>
        <section class="term"><h3>Term 1</h3><p>First term.</p></section>
        <section class="term"><h3>Term 2</h3><p>Second term.</p></section>
      </section>
      <footer class="document-footer">
        <div id="blank-pad" style="height: 944px"></div>
        <p class="document-disclaimer">Not legal advice.</p>
      </footer>
    </div>
  </div>
`;

function rootFrom(html: string): HTMLElement {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const root = dom.window.document.getElementById('alignment-document-export');
  if (!root) {
    throw new Error('missing export root');
  }
  return root;
}

test('page breaks still start the disclaimer on a new page and keep a term whole', () => {
  assert.deepEqual(agreementPdfPagebreak.before, ['.document-disclaimer']);
  assert.ok(agreementPdfPagebreak.avoid.includes('.term'));
  assert.ok(agreementPdfPagebreak.avoid.includes('.term-heading-keep'));
  assert.ok(agreementPdfPagebreak.avoid.includes('.document-disclaimer'));
});

test('a spacer already at the top of a page is the blank page', () => {
  assert.equal(isFullPageDisclaimerPad(944, 960), true);
  assert.equal(isFullPageDisclaimerPad(960, 960), true);
  assert.equal(isFullPageDisclaimerPad(897, 960), true);
  assert.equal(isFullPageDisclaimerPad(896, 960), false);
  assert.equal(isFullPageDisclaimerPad(632, 960), false);
  assert.equal(isFullPageDisclaimerPad(9, 960), false);
  assert.equal(isFullPageDisclaimerPad(Number.NaN, 960), false);
});

test('Detailed Terms stays with Term 1 and the summary heading stays put', () => {
  const root = rootFrom(AGREEMENT_HTML);
  keepDetailedTermsHeadingWithFirstTerm(root);

  const group = root.querySelector('.term-heading-keep');
  assert.ok(group);
  assert.equal(group?.querySelector('h2')?.textContent, 'Detailed Terms');
  assert.equal(group?.querySelector('.term h3')?.textContent, 'Term 1');
  assert.equal(group?.parentElement?.className, 'detailed-terms');

  const terms = root.querySelectorAll('.detailed-terms > .term, .detailed-terms > .term-heading-keep .term');
  assert.equal(terms.length, 2);
  const second = root.querySelector('.detailed-terms > .term');
  assert.equal(second?.querySelector('h3')?.textContent, 'Term 2');
  assert.equal(second?.parentElement?.classList.contains('term-heading-keep'), false);

  const summaryHeading = root.querySelector('.executive-summary > h2');
  assert.equal(summaryHeading?.textContent, 'Executive Summary');
  assert.equal(summaryHeading?.parentElement?.classList.contains('term-heading-keep'), false);
});

test('grouping the heading twice does not nest another wrapper', () => {
  const root = rootFrom(AGREEMENT_HTML);
  keepDetailedTermsHeadingWithFirstTerm(root);
  keepDetailedTermsHeadingWithFirstTerm(root);
  assert.equal(root.querySelectorAll('.term-heading-keep').length, 1);
});

test('preparing the export clones the node and leaves the page alone', () => {
  const root = rootFrom(AGREEMENT_HTML);
  const before = root.innerHTML;
  const prepared = prepareAgreementExportElement(root);
  assert.equal(root.innerHTML, before);
  assert.equal(root.querySelectorAll('.term-heading-keep').length, 0);
  assert.equal(prepared.querySelectorAll('.term-heading-keep').length, 1);
  assert.notEqual(prepared, root);
});

test('only the full-page spacer in front of the disclaimer is removed', () => {
  const root = rootFrom(AGREEMENT_HTML);
  assert.equal(removeFullPageDisclaimerPad(root, 960), true);
  assert.equal(root.querySelector('#blank-pad'), null);
  assert.ok(root.querySelector('.document-disclaimer'));

  const partial = rootFrom(AGREEMENT_HTML.replace('944px', '632px'));
  assert.equal(removeFullPageDisclaimerPad(partial, 960), false);
  assert.ok(partial.querySelector('#blank-pad'));

  const withText = rootFrom(AGREEMENT_HTML.replace(
    '<div id="blank-pad" style="height: 944px"></div>',
    '<div id="blank-pad" style="height: 944px"><span>not a spacer</span></div>',
  ));
  assert.equal(removeFullPageDisclaimerPad(withText, 960), false);
  assert.ok(withText.querySelector('#blank-pad'));
});
