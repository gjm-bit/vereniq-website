# Datamodel

Kernrelaties: `sites → pages → page_sections`; `sites → navigation_items/site_settings/legal_documents`; `organizations → organization_memberships`; `platform_users → roles → permissions`; `leads`, `media`, `articles`, `modules` en `audit_logs` zijn scopeerbaar op site en/of organisatie. Content heeft `draft`, `published` of `archived`; relevante content krijgt `site_id`.

Privacy foundation: `privacy_requests(status, subject_reference, requested_at, completed_at)` en `subprocessors(name, purpose, data_categories, processing_location, agreement_url, active)`.
