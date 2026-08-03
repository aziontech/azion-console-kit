import * as yup from 'yup'

export const SCOPE_CATEGORIES = ['global', 'environment', 'deployment', 'resource']

export const RESOURCE_SCOPE_TYPES = ['application', 'firewall']

export const SCOPE_TYPE_OPTIONS = [
  { label: 'Global', value: 'global' },
  { label: 'Environment', value: 'environment' },
  { label: 'Deployment', value: 'deployment' },
  { label: 'Resource', value: 'resource' }
]

export const RESOURCE_TYPE_OPTIONS = [
  { label: 'Application', value: 'application' },
  { label: 'Firewall', value: 'firewall' }
]

const scopeItemSchema = yup
  .object({
    type: yup
      .string()
      .oneOf(SCOPE_CATEGORIES, 'Invalid scope type')
      .required('Scope type is required'),
    resourceType: yup.string().nullable(),
    id: yup.string().nullable()
  })
  .test('scope-selection-complete', 'Complete the scope selection', (item) => {
    if (!item?.type) return false
    if (item.type === 'global') return true
    if (item.type === 'resource' && !RESOURCE_SCOPE_TYPES.includes(item.resourceType)) return false
    return typeof item.id === 'string' && item.id.trim().length > 0
  })

export const scopeArraySchema = yup
  .array()
  .of(scopeItemSchema)
  .min(1, 'At least one scope is required')
  .required('Scope is required')

export { scopeItemSchema }
