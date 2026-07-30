/**
 * HTML-escapes a value so untrusted text can be safely concatenated with fixed
 * markup before it reaches `v-html`.
 *
 * @param {any} value
 * @returns {string}
 */
export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Wraps the first case-insensitive occurrence of `query` in `text` with a single
 * `<mark class="search-highlight">`. Every text segment is HTML-escaped; only the
 * fixed mark markup is literal, so the result is safe for `v-html`.
 *
 * @param {any} text source text to render
 * @param {string} query search term (trimmed here)
 * @returns {string} escaped HTML with the match wrapped in <mark>
 */
export const highlightMatch = (text, query) => {
  if (!query || !text) return escapeHtml(text ?? '')
  const str = String(text)
  const needle = String(query).trim()
  if (!needle) return escapeHtml(str)
  const pos = str.toLowerCase().indexOf(needle.toLowerCase())
  if (pos === -1) return escapeHtml(str)
  // Every segment is HTML-escaped above; only the fixed <mark> markup is literal.
  /* eslint-disable xss/no-mixed-html -- segments are HTML-escaped; only fixed <mark> markup is literal */
  return (
    escapeHtml(str.slice(0, pos)) +
    '<mark class="search-highlight">' +
    escapeHtml(str.slice(pos, pos + needle.length)) +
    '</mark>' +
    escapeHtml(str.slice(pos + needle.length))
  )
  /* eslint-enable xss/no-mixed-html */
}
