// DELIBERATE DUPLICATE van master-beheer/api/_lib/mail-compose-text.ts
// (uitsluitend het stukje dat meer-vereniging-email-template.ts nodig heeft)
// - zelfde reden als elders in dit project: apart Vercel-project zonder
// gedeelde broncode. Pure functie, geen I/O.

const ESCAPE_MAP: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function plainTextToSafeHtml(value: string): string {
  const escaped = value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
  return escaped.split(/\r\n|\r|\n/).join('<br>');
}
