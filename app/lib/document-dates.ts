/**
 * Agreement document date formatting.
 *
 * Every date shown on the agreement (body, executive summary, signatures) must
 * render identically for both parties and match the frozen snapshot, so all of
 * them format in UTC — never the viewer's local timezone. A viewer in PDT
 * signing at 5:30pm on July 11 and a viewer in CET opening the same document
 * must see the same dates the frozen body text contains.
 */

export function formatAgreementDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

export function formatAgreementTimestamp(iso: string): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
  return `${formatted} UTC`;
}
