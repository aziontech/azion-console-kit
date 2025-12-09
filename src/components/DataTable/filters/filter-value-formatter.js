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

    default:
      return value
  }
}
