# Meer Vereniging

## Lokaal starten

`npm install` gevolgd door `npm run dev`. Gebruik `npm run build`, `npm run lint` en `npm test` voor checks.

## Werking

De publieke website leest gepubliceerde content uit repository-contracts. `/master` toont lokale development-auth als `content_admin` en de Website & Content foundation. Lokale seeddata is deterministisch. Vervang later alleen de lokale repository-adapters door Supabase-adapters.

Lees `docs/architecture/OVERVIEW.md`, `docs/security/RLS_MODEL.md` en de activation checklists vóór productie-activatie.
