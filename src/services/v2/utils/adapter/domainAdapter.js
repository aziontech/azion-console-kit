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

/**
 * Attempts to match a domain against known Edge DNS zones.
 * Returns the longest matching zone (most specific).
 *
 * @param {string} cleanDomain - Domain without wildcard prefix
 * @param {string[]} zones - Array of zone domain strings from Edge DNS
 * @returns {{ domain: string, subdomain: string } | null}
 */
function matchDomainToZone(cleanDomain, zones) {
  if (!zones || !zones.length || !cleanDomain) return null

  const lowerDomain = cleanDomain.toLowerCase()

  // Sort by length descending so we match the most specific zone first
  const sortedZones = [...zones].sort((valA, valB) => valB.length - valA.length)

  for (const zone of sortedZones) {
    const lowerZone = zone.toLowerCase()

    if (lowerDomain === lowerZone) {
      return { domain: zone, subdomain: '' }
    }

    if (lowerDomain.endsWith(`.${lowerZone}`)) {
      const subdomain = cleanDomain.slice(0, cleanDomain.length - zone.length - 1)
      return { domain: zone, subdomain }
    }
  }

  return null
}

export function getPrimaryDomain(urlOrHostname, zones = []) {
  if (!urlOrHostname || typeof urlOrHostname !== 'string') {
    return { domain: '', subdomain: '' }
  }

  const wildcardInfo = parseWildcardDomain(urlOrHostname)

  // 1. Try zone-aware matching first
  const zoneMatch = matchDomainToZone(wildcardInfo.cleanDomain, zones)

  if (zoneMatch) {
    if (wildcardInfo.hasWildcard) {
      return {
        ...zoneMatch,
        subdomain: wildcardInfo.wildcardPrefix,
        isWildcard: true
      }
    }
    return zoneMatch
  }

  // 2. Fallback to psl.parse
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
