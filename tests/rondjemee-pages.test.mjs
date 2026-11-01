import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../app/[...slug]/page.tsx', import.meta.url), 'utf8');
const local = readFileSync(new URL('../src/repositories/local.ts', import.meta.url), 'utf8');

// Haalt de inhoud van een juridische pagina uit de bron (de `legal`-map is een letterlijk object).
function content(slug) {
  const start = page.indexOf(`"${slug}":{`);
  assert.ok(start >= 0, `${slug} ontbreekt in de legal-map`);
  // de twee nieuwe pagina's staan na elkaar op één regel; de privacypagina eindigt waar de ondersteuningspagina begint
  const next = page.indexOf('"rondjemee-ondersteuning":{', start + 10);
  const end = slug === 'rondjemee-privacy' ? next : page.indexOf('\n', start);
  return page.slice(start, end);
}

for (const slug of ['rondjemee-privacy', 'rondjemee-ondersteuning']) {
  test(`${slug}: geregistreerd als gepubliceerde pagina en zonder plaatshouders of verzonnen gegevens`, () => {
    assert.match(local, new RegExp(`"${slug}"`));
    const text = content(slug);
    assert.doesNotMatch(text, /TODO|invullen|\[(?!\{)[^\]{}]{3,}\]|lorem|xxx|example\.(com|nl)|\+31|\b0[1-9][0-9]{8}\b/i, 'plaatshouder of verzonnen contactgegeven');
    assert.doesNotMatch(text, /KvK-?nummer\s*:?\s*\d|BTW-?nummer\s*:?\s*[A-Z]{2}\d|IBAN\s*:?\s*[A-Z]{2}\d/i, 'bedrijfsnummers horen alleen erin als ze geverifieerd zijn');
    assert.match(text, /info@meervereniging\.nl/);
  });
}

test('privacypagina beschrijft wat de app werkelijk doet en niets dat niet bestaat', () => {
  const t = content('rondjemee-privacy');
  for (const must of ['e-mailadres', 'tweede keuze', 'zeven dagen', 'Privacy en account', 'Supabase', 'Europese Unie', 'Autoriteit Persoonsgegevens', 'info@meervereniging.nl', 'onder de 12 jaar', 'Zonder e-mailadres kun je niet inloggen', 'geautomatiseerde verwerking', 'Verenigde Staten']) assert.ok(t.includes(must), must);
  // 1.0.0 heeft geen pushmeldingen, geen analytics, geen advertenties, geen locatie
  assert.doesNotMatch(t, /pushmelding|Google Analytics|Facebook|advertentienetwerk|locatiegegevens verzamel/i);
  assert.match(t, /geen reclame/);
});

test('ondersteuningspagina volgt de echte schermen en beloofde niets over reactietijden', () => {
  const t = content('rondjemee-ondersteuning');
  for (const must of ['Aanmelden met wachtwoord', 'Terugdraaien', 'Weer verkrijgbaar', 'Instellingen', 'Privacy en account', 'info@meervereniging.nl']) assert.ok(t.includes(must), must);
  assert.doesNotMatch(t, /binnen \d+ (uur|werkdag|dag)|24\/7|altijd bereikbaar/i);
});
