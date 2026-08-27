# Multi-tenancy

Elke tenantgebonden tabel krijgt een niet-door-de-client-bepaalde `organization_id`; websitecontent krijgt aanvullend `site_id`. Queries ontvangen context van de geauthenticeerde identiteit, niet van een formulierparameter. Postgres RLS is deny-by-default; elevated platformtoegang is expliciet en auditbaar.
