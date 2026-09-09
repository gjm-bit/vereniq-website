// MEER VERENIGING E-MAIL DESIGN SYSTEM 1.0 — DELIBERATE DUPLICATE van
// master-beheer/api/_lib/mail-brand.ts (zelfde reden als elders in dit
// project: apart Vercel-project zonder gedeelde broncode, zie het
// bestandscommentaar in trial-signup-email.ts). Letterlijke, vaste
// merkconstanten voor de gedeelde HTML-e-mail-layout
// (meer-vereniging-email-template.ts) - geen per-tenant variatie, dit
// project mailt altijd en alleen als Meer Vereniging zelf.
export const MEER_VERENIGING_PORTAL_NAME = 'Meer Vereniging';
export const MEER_VERENIGING_SLOGAN = 'Minder regelen. Meer verenigen.';
export const MEER_VERENIGING_WEBSITE_URL = 'https://meervereniging.nl';
export const MEER_VERENIGING_WEBSITE_LABEL = 'www.meervereniging.nl';
export const MEER_VERENIGING_INFO_EMAIL = 'info@meervereniging.nl';
export const MEER_VERENIGING_SUPPORT_EMAIL = 'support@meervereniging.nl';

export const MEER_VERENIGING_COLOR_BACKGROUND = '#06152F';
export const MEER_VERENIGING_COLOR_SURFACE = '#0B2140';
export const MEER_VERENIGING_COLOR_PRIMARY = '#8B36E8';
export const MEER_VERENIGING_COLOR_SECONDARY = '#2476F3';

export const MEER_VERENIGING_COLOR_TEXT = '#FFFFFF';
export const MEER_VERENIGING_COLOR_BODY_TEXT = '#C7D2E8';
export const MEER_VERENIGING_COLOR_MUTED_TEXT = '#8CA0C7';
export const MEER_VERENIGING_COLOR_LINK = '#6FA8FF';

// DELIBERATE DUPLICATE van master-beheer/api/_lib/mailbox-signature.ts
// (alleen deze ene constante, verder niet gebruikt door dit project).
export const MAIL_BASE_FONT_FAMILY = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
