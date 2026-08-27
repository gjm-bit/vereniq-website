import { sanitizeRichText } from "@/src/lib/sanitize-rich-text";

/**
 * The one public rendering boundary for every Websitebeheer rich-text field.
 * Headings, labels and proof-points intentionally do not use this component:
 * they remain React text nodes and therefore cannot interpret HTML.
 */
export function CmsRichText({ html, className = "" }: { html?: string; className?: string }) {
  if (!html) return null;
  return <div className={`cms-rich-text ${className}`.trim()} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />;
}
