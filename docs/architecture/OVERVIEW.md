# Architectuuroverzicht

De app gebruikt routes als presentatie, `src/components` voor herbruikbare UI, `src/repositories` als data-grens en `src/types` voor contracts. Lokale deterministische adapters staan achter repository-interfaces. Een toekomstige Supabase-adapter implementeert dezelfde interfaces; de UI en businessregels veranderen daarmee niet.

Publieke routes lezen uitsluitend gepubliceerde records. Het Master Portaal is het centrale beheeroppervlak en wordt later via Supabase Auth plus server-side autorisatie beschermd.
