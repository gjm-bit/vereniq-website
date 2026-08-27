# RLS-model

RLS staat op alle tenanttabellen aan en is deny-by-default: standaard is er geen policy. Lidmaatschap koppelt `auth.uid()` aan een organisatie en rol. Lees/schrijfpolicies vergelijken de rij-`organization_id` met deze server-afgeleide membership. Service-role blijft uitsluitend server-side. Platformbeheer krijgt geen brede bypass, maar een expliciet gecontroleerde elevated policy met auditlog.

Na activatie testen we: anonieme toegang geweigerd, cross-tenant lezen/schrijven geweigerd, conceptcontent niet publiek, rollen per actie en service-role nooit in clientbundles.
