import DOMPurify from 'isomorphic-dompurify';
import { renderPrompt } from './prompts';
import type { DocumentSection } from './types';

export const AGREEMENT_DOCUMENT_ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'br',
  'div',
  'section',
  'article',
  'span',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

export const AGREEMENT_DOCUMENT_ALLOWED_ATTR = ['class', 'id'];

export interface RenderAgreementDocumentInput {
  participantNames: string[];
  documentDate: string;
  templateName: string;
  templateCategory: string;
  finalPositions: Record<string, unknown>;
  summary: string[];
  skeletonHtml: string;
}

export function sanitizeAgreementDocumentHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: AGREEMENT_DOCUMENT_ALLOWED_TAGS,
    ALLOWED_ATTR: AGREEMENT_DOCUMENT_ALLOWED_ATTR,
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  }) as string;
}

export function parseDocumentSections(html: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let match;
  let sectionIndex = 0;

  while ((match = sectionRegex.exec(html)) !== null) {
    const heading = match[1].replace(/<[^>]*>/g, '').trim();
    const body = match[2].trim();
    const id = heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `section-${sectionIndex}`;

    sections.push({ id, heading, body });
    sectionIndex++;
  }

  return sections;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const MAX_POSITION_RENDER_DEPTH = 4;

function stringifyForDepthLimit(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

function renderPositionValue(value: unknown, depth: number): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (depth >= MAX_POSITION_RENDER_DEPTH) {
    return escapeHtml(stringifyForDepthLimit(value));
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return escapeHtml(String(value));
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => renderPositionValue(item, depth + 1))
      .filter((item) => item.length > 0);

    return items.length > 0
      ? `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '';
  }

  if (typeof value === 'object') {
    const items = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const renderedItem = renderPositionValue(item, depth + 1);
        if (!renderedItem) {
          return '';
        }
        return `<li><strong>${escapeHtml(humanizeKey(key))}:</strong> ${renderedItem}</li>`;
      })
      .filter((item) => item.length > 0);

    return items.length > 0 ? `<ul>${items.join('')}</ul>` : '';
  }

  return escapeHtml(String(value));
}

export function renderPositionBody(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const renderedValue = renderPositionValue(value, 0);
  if (!renderedValue) {
    return '';
  }

  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? `<p>${renderedValue}</p>`
    : renderedValue;
}

export function renderAgreementDocument(input: RenderAgreementDocumentInput): {
  documentHtml: string;
  sections: DocumentSection[];
} {
  const summaryItems = input.summary
    .map((item) => `        <li>${escapeHtml(item)}</li>`)
    .join('\n');
  const termsSections = Object.entries(input.finalPositions)
    .map(
      ([key, value]) =>
        `      <section class="term">\n        <h3>${escapeHtml(humanizeKey(key))}</h3>\n        ${renderPositionBody(value)}\n      </section>`
    )
    .join('\n');

  const rawHtml = renderPrompt(input.skeletonHtml, {
    participantList: input.participantNames.map((name) => escapeHtml(name)).join(' and '),
    documentDate: escapeHtml(input.documentDate),
    templateName: escapeHtml(input.templateName),
    templateCategory: escapeHtml(input.templateCategory),
    summaryItems,
    termsSections,
  });
  const documentHtml = sanitizeAgreementDocumentHtml(rawHtml);

  return {
    documentHtml,
    sections: parseDocumentSections(documentHtml),
  };
}
