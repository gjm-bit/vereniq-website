const ALLOWED_TAGS = new Set(['p', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'br']);
const DANGEROUS_BLOCK = /<(script|style|iframe|object|embed|form|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_OPEN = /<(script|style|iframe|object|embed|form|svg|math)\b[^>]*>/gi;
const TAG = /<\/?([a-z0-9]+)([^>]*)>/gi;
const ATTRIBUTE = /([a-zA-Z:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
const SAFE_HREF = /^(https?:\/\/|\/|mailto:|tel:)/i;
const SAFE_CLASSES = new Set(['mv-text-body', 'mv-text-lead', 'mv-text-small', 'mv-text-h1', 'mv-text-h2', 'mv-text-h3', 'mv-text-quote', 'mv-size-small', 'mv-size-normal', 'mv-size-large']);

/**
 * Websitebeheer's contenteditable editor can serialise its own allowed markup
 * as HTML entities. Decode exactly one layer before the allowlist runs, so
 * legacy escaped `<p>` / `<strong>` markup renders semantically while unsafe
 * tags and attributes still go through the same sanitisation boundary.
 */
function decodeEditorEntities(input: string): string {
  const entities: Record<string, string> = {
    lt: '<', gt: '>', amp: '&', quot: '"', '#39': "'", '#x27': "'",
  };
  return input.replace(/&(lt|gt|amp|quot|#39|#x27);/gi, (_match, entity: string) => entities[entity.toLowerCase()] ?? _match);
}

export function sanitizeRichText(input: string): string {
  const clean = decodeEditorEntities(input).replace(/<!--[\s\S]*?-->/g, '').replace(DANGEROUS_BLOCK, '').replace(DANGEROUS_OPEN, '');
  return clean.replace(TAG, (full, rawName: string, rawAttributes: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (full.startsWith('</')) return `</${name}>`;
    if (name === 'br') return '<br />';
    if (name !== 'a') {
      const classMatch = rawAttributes.match(/\bclass\s*=\s*(["'])([^"']*)\1/i);
      const classes = classMatch ? classMatch[2].split(/\s+/).filter((item) => SAFE_CLASSES.has(item)) : [];
      return classes.length ? `<${name} class="${classes.join(' ')}">` : `<${name}>`;
    }
    let attributes = '';
    let match: RegExpExecArray | null;
    while ((match = ATTRIBUTE.exec(rawAttributes)) !== null) {
      const attrName = match[1].toLowerCase();
      const value = match[2].replace(/^['"]|['"]$/g, '');
      if (attrName === 'href' && SAFE_HREF.test(value.trim())) attributes += ` href="${value.replace(/"/g, '&quot;')}"`;
      if (attrName === 'target' && value === '_blank') attributes += ' target="_blank"';
    }
    ATTRIBUTE.lastIndex = 0;
    if (attributes.includes(' target="_blank"')) attributes += ' rel="noopener noreferrer"';
    return `<a${attributes}>`;
  });
}
