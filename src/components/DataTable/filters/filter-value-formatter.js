const STATUS_MAP = {
  true: 'Active',
  false: 'Inactive'
}

const INFRASTRUCTURE_MAP = {
  1: 'Production',
  2: 'Staging'
}

const CERTIFICATE_TYPE_MAP = {
  edge_certificate: 'TLS Certificate',
  trusted_ca_certificate: 'Trusted CA Certificate'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
}

export const formatFilterValue = (filterKey, value) => {
  const normalizedKey = filterKey.toLowerCase()

  switch (normalizedKey) {
    case 'active':
    case 'status':
      return STATUS_MAP[value] || value

    case 'infrastructure':
      return INFRASTRUCTURE_MAP[value] || value

    case 'last_editor':
      return value

    case 'type':
      return CERTIFICATE_TYPE_MAP[value] || value

    case 'last_modified':
    case 'lastmodified':
      if (typeof value === 'object' && value !== null) {
        if (value.label && value.label.trim()) {
          return value.label
        }
        if (value.value?.start && value.value?.end) {
          return `${formatDate(value.value.start)} → ${formatDate(value.value.end)}`
        }
      }
      return value

    default:
      if (Array.isArray(value)) {
        return value.join(', ')
      }
      return value
  }
}
