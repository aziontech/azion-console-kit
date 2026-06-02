import * as yup from 'yup'

export const SCOPE_TYPES = ['global', 'environment', 'deployment', 'resource']

export const SCOPE_TYPE_OPTIONS = [
  { label: 'Global', value: 'global' },
  { label: 'Environment', value: 'environment' },
  { label: 'Deployment', value: 'deployment' },
  { label: 'Resource', value: 'resource' }
]

const idFieldForType = (type) => (type === 'global' ? null : `${type}_id`)

const scopeItemSchema = yup
  .object({
    type: yup.string().oneOf(SCOPE_TYPES, 'Invalid scope type').required('Scope type is required'),
    environment_id: yup.string().nullable(),
    deployment_id: yup.string().nullable(),
    resource_id: yup.string().nullable()
  })
  .test('scope-id-matches-type', 'Scope id does not match scope type', (item) => {
    if (!item?.type) return false
    const idKey = idFieldForType(item.type)
    if (!idKey) return true
    const idValue = item[idKey]
    return typeof idValue === 'string' && idValue.trim().length > 0
  })

export const scopeArraySchema = yup
  .array()
  .of(scopeItemSchema)
  .min(1, 'At least one scope is required')
  .required('Scope is required')

export { idFieldForType, scopeItemSchema }
