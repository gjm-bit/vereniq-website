# Meer Vereniging — permanente regels

## Product & security

1. Het product is multi-tenant; organisatiegegevens mogen nooit mengen.
2. Tenant-isolatie wordt op database-niveau afgedwongen met Supabase RLS; frontend-controles zijn nooit voldoende.
3. Gebruik least privilege, server-side autorisatie, input-validatie en auditbare beheeracties.
4. Geen secrets of hardcoded productiegegevens in git. Geen destructieve databaseacties buiten expliciete migraties.
5. AVG is een harde eis: dataminimalisatie, privacy by design/default en voorbereide rechten van betrokkenen.
6. ISO 27001 en NIS2-principes zijn praktische leidraden; claim nooit certificering of gebruik geen ISO-logo.

## UX

Premium, rustig en functioneel. Controleer mobile-first, 44×44 touch targets, toetsenbordnavigatie, focus, lege/loading/foutstaten. Gebruik rood alleen voor echte destructieve acties; toon geen technische fouten aan eindgebruikers.

## Architecture

UI gebruikt repositories/services, nooit directe mockdata. Houd adapters verwisselbaar. Behoud server/client boundaries; businesslogica hoort niet in presentatiecomponenten.
