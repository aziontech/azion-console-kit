import psl from 'psl'

function parseWildcardDomain(urlOrHostname) {
  if (!urlOrHostname || typeof urlOrHostname !== 'string') {
    return { hasWildcard: false, cleanDomain: urlOrHostname, wildcardPrefix: '' }
  }

  const trimmed = urlOrHostname.trim()

  if (trimmed.startsWith('*.')) {
    return {
      hasWildcard: true,
      cleanDomain: trimmed.substring(2),
      wildcardPrefix: '*'
    }
  }

  return {
    hasWildcard: false,
    cleanDomain: trimmed,
    wildcardPrefix: ''
  }
}

export function getPrimaryDomain(urlOrHostname) {
  if (!urlOrHostname || typeof urlOrHostname !== 'string') {
    return { domain: '', subdomain: '' }
  }

  const wildcardInfo = parseWildcardDomain(urlOrHostname)

  const parsed = psl.parse(wildcardInfo.cleanDomain)

  if (parsed && parsed.domain) {
    if (wildcardInfo.hasWildcard) {
      return {
        ...parsed,
        subdomain: wildcardInfo.wildcardPrefix,
        isWildcard: true
      }
    }
    return parsed
  }

  return { domain: '', subdomain: '' }
}
