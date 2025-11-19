/**
 * Utilities to derive certificate subject names (commonName and SANs) from domains.
 */

/**
 * @typedef {Object} DomainEntry
 * @property {string} domain - Base domain, e.g. "example.com"
 * @property {string} [subdomain] - Optional subdomain, e.g. "www"
 */

/**
 * Normalize an entry (string or object) into an FQDN.
 * - Trims whitespace
 * - Removes protocol if present
 * - Removes trailing dot
 * - Lowercases
 *
 * @param {string|DomainEntry} entry
 * @returns {string}
 */
function toFqdn(entry) {
  if (typeof entry === 'string') {
    return sanitizeFqdn(entry)
  }
  if (entry && typeof entry === 'object') {
    const { subdomain, domain } = entry
    return sanitizeFqdn(`${subdomain ? `${subdomain}.` : ''}${domain}`)
  }
  return ''
}

/**
 * Sanitize FQDN string: trim, strip protocol, remove trailing dot, lowercase
 * @param {string} name
 * @returns {string}
 */
function sanitizeFqdn(name) {
  const trimmed = String(name).trim().replace(/\s+/g, '')
  const noProto = trimmed.replace(/^(https?:\/\/)/i, '')
  const noTrailingDot = noProto.replace(/\.$/, '')
  return noTrailingDot.toLowerCase()
}

/**
 * Build commonName and alternativeNames from a domains array.
 * - Accepts strings or { subdomain, domain } objects
 * - Removes invalid/empty entries
 * - Deduplicates while preserving order
 *
 * @param {(string|DomainEntry)[]} domains
 * @returns {{ commonName: string, alternativeNames: string[] }}
 */
export function buildCertificateNames(domains) {
  if (!Array.isArray(domains) || domains.length === 0) {
    return { commonName: '', alternativeNames: [] }
  }

  const seen = new Set()
  const flat = []
  for (const entry of domains) {
    const fqdn = toFqdn(entry)
    if (fqdn && fqdn !== '.' && !seen.has(fqdn)) {
      seen.add(fqdn)
      flat.push(fqdn)
    }
  }

  const [first, ...rest] = flat
  return { commonName: first || '', alternativeNames: rest }
}
