// PROEFABONNEMENT FASE 3 — DELIBERATE DUPLICATE van master-beheer/api/_lib/
// server-only.ts (zelfde reden: apart Vercel-project zonder gedeelde
// TypeScript-broncode, zie docs/architecture/OVERVIEW.md).

export function assertServerOnly() {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw new Error('Deze servermodule mag niet in clientcode worden gebruikt.');
  }
}
