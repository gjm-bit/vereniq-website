// MEER VERENIGING E-MAIL DESIGN SYSTEM 1.0 — DELIBERATE DUPLICATE van
// master-beheer/api/_lib/meer-vereniging-email-template.ts (zelfde reden als
// elders in dit project: apart Vercel-project zonder gedeelde broncode, zie
// het bestandscommentaar in trial-signup-email.ts). Puur functies (geen
// I/O, geen React/JSX) - string-templating met table-based layout + inline
// CSS, hetzelfde bewezen patroon als master-beheer.
//
// Ontworpen voor Outlook (Word-rendering-engine)/Gmail/Apple Mail: table-
// based structuur, uitsluitend inline CSS (een <style>-blok is aanwezig
// maar puur progressief - alle kritieke kleuren/afmetingen staan ALTIJD ook
// inline, dus de mail blijft correct als <style> wordt gestript), max-width
// 600px, geen JavaScript, geen externe stylesheet/webfont.
import {
  MAIL_BASE_FONT_FAMILY,
  MEER_VERENIGING_COLOR_BACKGROUND, MEER_VERENIGING_COLOR_BODY_TEXT, MEER_VERENIGING_COLOR_LINK,
  MEER_VERENIGING_COLOR_MUTED_TEXT, MEER_VERENIGING_COLOR_PRIMARY, MEER_VERENIGING_COLOR_SECONDARY,
  MEER_VERENIGING_COLOR_SURFACE, MEER_VERENIGING_COLOR_TEXT, MEER_VERENIGING_INFO_EMAIL,
  MEER_VERENIGING_PORTAL_NAME, MEER_VERENIGING_SLOGAN, MEER_VERENIGING_SUPPORT_EMAIL,
  MEER_VERENIGING_WEBSITE_LABEL, MEER_VERENIGING_WEBSITE_URL,
} from './mail-brand.ts';
import { MEER_VERENIGING_MARK_EMAIL_PNG_BASE64 } from './mail-brand-assets.ts';
import { plainTextToSafeHtml } from './mail-compose-text.ts';
import type { ResendAttachment } from './trial-signup-email.ts';

// Stabiele Content-ID - hetzelfde bijlage-object wordt via deze ene cid: in
// zowel de header als de footer verwezen (Resend/e-mailclients staan een
// meervoudige verwijzing naar dezelfde bijlage binnen één bericht toe), dus
// de afbeelding wordt maar ÉÉN keer meegestuurd, niet twee keer.
const LOGO_CONTENT_ID = 'meer-vereniging-mark';

/** Geen I/O - bouwt de Resend-bijlage voor het beeldmerk uit de gebundelde base64-string. */
export function meerVerenigingEmailLogoAttachment(): ResendAttachment {
  return {
    content: MEER_VERENIGING_MARK_EMAIL_PNG_BASE64,
    filename: 'meer-vereniging-logo.png',
    contentType: 'image/png',
    contentId: LOGO_CONTENT_ID,
  };
}

export type MeerVerenigingEmailInput = Readonly<{
  /** Onzichtbare inbox-preview-samenvatting. */
  preheader: string;
  /** Kleine badge boven de titel, optioneel. */
  eyebrow?: string;
  /** Grote, prominente titel (meestal het al-gerenderde onderwerp). */
  title: string;
  /** Platte tekst - alinea's gescheiden door een lege regel, exact zoals de bestaande plain-text-mail; wordt NOOIT inhoudelijk herschreven door dit bestand. */
  bodyText: string;
  /** Optionele call-to-action-knop. */
  primaryCta?: Readonly<{ label: string; url: string }>;
  /** Optionele aparte afsluitzin, ONDER de CTA. */
  closing?: string;
}>;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));

// Herkent een kale https://-URL in AL ge-escapete/al-<br>-samengevoegde HTML
// en maakt er een echte, klikbare <a> van. Trimt gangbare afsluitende
// leestekens van de link af (die horen bij de zin, niet bij de URL).
const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?)\]}]+$/;
function linkifyEscapedHtml(escapedHtml: string, color: string): string {
  return escapedHtml.replace(/https?:\/\/[^\s<]+/g, (rawUrl) => {
    const trailingMatch = rawUrl.match(TRAILING_PUNCTUATION_PATTERN);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const url = trailing ? rawUrl.slice(0, -trailing.length) : rawUrl;
    if (!url) return rawUrl;
    return `<a href="${url}" style="color:${color};text-decoration:underline;">${url}</a>${trailing}`;
  });
}

/** Splitst platte tekst op lege regels in alinea's - elke alinea zelf via plainTextToSafeHtml (escapen + <br> voor interne regeleinden), daarna gelinkificeerd. */
function renderBodyParagraphsHtml(bodyText: string, linkColor: string): string {
  const paragraphs = bodyText.trim().split(/\n\s*\n/).filter((block) => block.trim().length > 0);
  return paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;padding:0;">${linkifyEscapedHtml(plainTextToSafeHtml(paragraph.trim()), linkColor)}</p>`)
    .join('');
}

// Wanneer een primaire CTA-URL is meegegeven, verwijdert dit de ENE regel
// die die URL letterlijk bevat uit de ZICHTBARE HTML-body (de plain-text-
// variant, renderMeerVerenigingEmailText, gebruikt bewust de ONGEWIJZIGDE
// bodyText - de URL blijft daar dus altijd expliciet aanwezig).
function stripPrimaryCtaLineFromHtmlBody(bodyText: string, ctaUrl: string): string {
  const lines = bodyText.split('\n');
  const matchIndex = lines.findIndex((line) => line.includes(ctaUrl));
  if (matchIndex === -1) return bodyText;
  return lines.filter((_, index) => index !== matchIndex).join('\n');
}

function renderCtaHtml(cta: Readonly<{ label: string; url: string }>): string {
  return `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
          <tr>
            <td align="center" bgcolor="${MEER_VERENIGING_COLOR_PRIMARY}" style="border-radius:10px;background-color:${MEER_VERENIGING_COLOR_PRIMARY};background-image:linear-gradient(135deg, ${MEER_VERENIGING_COLOR_PRIMARY} 0%, ${MEER_VERENIGING_COLOR_SECONDARY} 100%);">
              <a href="${cta.url}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${MAIL_BASE_FONT_FAMILY};font-size:16px;line-height:20px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">${escapeHtml(cta.label)}</a>
            </td>
          </tr>
        </table>`;
}

const HEADER_LOGO_WIDTH = 80;
const HEADER_LOGO_HEIGHT = 148;
const FOOTER_LOGO_WIDTH = 32;
const FOOTER_LOGO_HEIGHT = 59;

export function renderMeerVerenigingEmailHtml(input: MeerVerenigingEmailInput): string {
  const eyebrowHtml = input.eyebrow
    ? `<div style="margin:0 0 12px;"><span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:rgba(139,54,232,0.18);color:${MEER_VERENIGING_COLOR_SECONDARY};font-family:${MAIL_BASE_FONT_FAMILY};font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</span></div>`
    : '';
  const ctaHtml = input.primaryCta ? renderCtaHtml(input.primaryCta) : '';
  const closingHtml = input.closing
    ? `<p style="margin:20px 0 0;padding:0;">${plainTextToSafeHtml(input.closing)}</p>`
    : '';
  const visibleBodyText = input.primaryCta ? stripPrimaryCtaLineFromHtmlBody(input.bodyText, input.primaryCta.url) : input.bodyText;
  // PREHEADER: staat wél in de HTML (nodig voor de inbox-preview van de
  // meeste clients), maar blijft zelf onzichtbaar (0-hoogte, opacity 0).
  const preheaderPadding = '&nbsp;&zwnj;'.repeat(40);

  return `<!doctype html>
<html lang="nl" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.title)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}
  body{margin:0;padding:0;width:100%!important;background-color:${MEER_VERENIGING_COLOR_BACKGROUND};}
  a{color:${MEER_VERENIGING_COLOR_LINK};}
  @media (max-width:480px){
    .mv-card{padding:26px 20px!important;}
    .mv-title{font-size:22px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${MEER_VERENIGING_COLOR_BACKGROUND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${MEER_VERENIGING_COLOR_BACKGROUND};">${escapeHtml(input.preheader)}${preheaderPadding}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${MEER_VERENIGING_COLOR_BACKGROUND};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:8px 24px 22px;">
              <img src="cid:${LOGO_CONTENT_ID}" width="${HEADER_LOGO_WIDTH}" height="${HEADER_LOGO_HEIGHT}" alt="${escapeHtml(MEER_VERENIGING_PORTAL_NAME)}" style="display:block;margin:0 auto 14px;border:0;outline:none;width:${HEADER_LOGO_WIDTH}px;height:${HEADER_LOGO_HEIGHT}px;" />
              <div style="font-family:${MAIL_BASE_FONT_FAMILY};font-size:20px;font-weight:800;letter-spacing:1.5px;color:${MEER_VERENIGING_COLOR_TEXT};">${escapeHtml(MEER_VERENIGING_PORTAL_NAME).toUpperCase()}</div>
              <div style="font-family:${MAIL_BASE_FONT_FAMILY};font-size:13px;color:${MEER_VERENIGING_COLOR_MUTED_TEXT};margin-top:6px;">${escapeHtml(MEER_VERENIGING_SLOGAN)}</div>
              <div style="height:3px;line-height:3px;font-size:1px;margin:18px auto 0;width:64px;background-color:${MEER_VERENIGING_COLOR_PRIMARY};background-image:linear-gradient(90deg, ${MEER_VERENIGING_COLOR_PRIMARY} 0%, ${MEER_VERENIGING_COLOR_SECONDARY} 100%);border-radius:2px;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="mv-card" style="background-color:${MEER_VERENIGING_COLOR_SURFACE};border-radius:16px;padding:36px 32px 28px;">
              ${eyebrowHtml}
              <h1 class="mv-title" style="margin:0 0 16px;padding:0;font-family:${MAIL_BASE_FONT_FAMILY};font-size:26px;line-height:32px;font-weight:800;color:${MEER_VERENIGING_COLOR_TEXT};">${escapeHtml(input.title)}</h1>
              <div style="font-family:${MAIL_BASE_FONT_FAMILY};font-size:15px;line-height:24px;color:${MEER_VERENIGING_COLOR_BODY_TEXT};">
                ${renderBodyParagraphsHtml(visibleBodyText, MEER_VERENIGING_COLOR_LINK)}
                ${closingHtml}
              </div>
              ${ctaHtml}
            </td>
          </tr>
          <tr><td style="height:20px;line-height:20px;font-size:1px;">&nbsp;</td></tr>
          <tr>
            <td align="center" style="padding:0 20px 12px;">
              <img src="cid:${LOGO_CONTENT_ID}" width="${FOOTER_LOGO_WIDTH}" height="${FOOTER_LOGO_HEIGHT}" alt="${escapeHtml(MEER_VERENIGING_PORTAL_NAME)}" style="display:block;margin:0 auto 10px;border:0;outline:none;width:${FOOTER_LOGO_WIDTH}px;height:${FOOTER_LOGO_HEIGHT}px;" />
              <div style="font-family:${MAIL_BASE_FONT_FAMILY};font-size:13px;line-height:20px;color:${MEER_VERENIGING_COLOR_MUTED_TEXT};">
                Team ${escapeHtml(MEER_VERENIGING_PORTAL_NAME)}<br>
                ${escapeHtml(MEER_VERENIGING_SLOGAN)}<br>
                <a href="mailto:${MEER_VERENIGING_INFO_EMAIL}" style="color:${MEER_VERENIGING_COLOR_LINK};text-decoration:none;">${MEER_VERENIGING_INFO_EMAIL}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${MEER_VERENIGING_SUPPORT_EMAIL}" style="color:${MEER_VERENIGING_COLOR_LINK};text-decoration:none;">${MEER_VERENIGING_SUPPORT_EMAIL}</a><br>
                <a href="${MEER_VERENIGING_WEBSITE_URL}" style="color:${MEER_VERENIGING_COLOR_LINK};text-decoration:none;">${MEER_VERENIGING_WEBSITE_LABEL}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderMeerVerenigingEmailText(input: MeerVerenigingEmailInput): string {
  const lines: string[] = [];
  if (input.eyebrow) lines.push(input.eyebrow.toUpperCase());
  lines.push(input.title, '');
  lines.push(input.bodyText.trim());
  if (input.closing) lines.push('', input.closing);
  if (input.primaryCta) lines.push('', `${input.primaryCta.label}: ${input.primaryCta.url}`);
  lines.push(
    '',
    '--',
    `Team ${MEER_VERENIGING_PORTAL_NAME}`,
    MEER_VERENIGING_SLOGAN,
    MEER_VERENIGING_INFO_EMAIL,
    MEER_VERENIGING_SUPPORT_EMAIL,
    MEER_VERENIGING_WEBSITE_LABEL,
  );
  return lines.join('\n');
}
