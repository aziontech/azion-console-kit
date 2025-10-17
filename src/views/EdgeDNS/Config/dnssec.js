const DNSSEC_FIELDS = Object.freeze([
  {
    label: 'Key Tag',
    name: 'key-tag',
    key: 'key_tag',
    description:
      'Unique identifier for the DNSSEC key used to sign your zone. Use this value with your domain provider.'
  },
  {
    label: 'Algorithm',
    name: 'algorithm',
    key: 'algorithm_type',
    description: 'Specifies the algorithm used to generate the DNSSEC key.'
  },
  {
    label: 'Digest Type',
    name: 'digestType',
    key: 'digest_type',
    description: 'Indicates the hash function used for the DNSSEC digest.'
  },
  {
    label: 'Digest',
    name: 'digest',
    key: 'digest',
    description:
      'Cryptographic hash of the public key for DNSSEC validation. Provide this to your provider.'
  }
])

const DEFAULT_VALUE_CREATE = 'Create to show'
const DEFAULT_VALUE_SAVE = 'Save to show'

const resolveValue = (source, key) => {
  const raw = source?.[key]
  if (raw && typeof raw === 'object' && 'slug' in raw) return raw.slug
  return raw
}

export const handleCopyDNSSEC = (dnssecSource = null, isEdit = false) => {
  const baseValue = isEdit ? DEFAULT_VALUE_SAVE : DEFAULT_VALUE_CREATE

  if (!dnssecSource) {
    return DNSSEC_FIELDS.map((field) => ({
      ...field,
      value: baseValue,
      disabledCopyButton: true
    }))
  }

  return DNSSEC_FIELDS.map((field) => {
    const value = resolveValue(dnssecSource, field.key)
    return {
      ...field,
      value: value ?? baseValue,
      disabledCopyButton: !value
    }
  })
}
