// src/services/domainAdapter.js
import psl from 'psl'

export function getPrimaryDomain(urlOrHostname) {
  if (!urlOrHostname || typeof urlOrHostname !== 'string') {
    return { domain: '', subdomain: '' }
  }

  const parsed = psl.parse(urlOrHostname)

  if (parsed && parsed.domain) {
    return parsed
  }
  return { domain: '', subdomain: '' }
}
