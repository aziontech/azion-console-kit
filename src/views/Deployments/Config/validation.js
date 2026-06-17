import * as yup from 'yup'

export const ALLOWED_RESOURCE_TYPES = [
  'application',
  'firewall',
  'custom_page',
  'function',
  'network_list'
]

export const validationSchema = yup.object({
  name: yup.string().required().min(3).max(255).label('Name'),
  description: yup.string().nullable().default(''),
  binding_policy: yup.string().required().oneOf(['STRICT', 'FLEXIBLE']).label('Binding Policy'),
  deployment_version_policy: yup
    .string()
    .required()
    .oneOf(['single_version', 'versioned_urls'])
    .label('Deployment Version Policy'),
  allowed_resource_types: yup
    .array()
    .of(yup.string().oneOf(ALLOWED_RESOURCE_TYPES))
    .min(1, 'Select at least one resource type')
    .required()
    .label('Allowed Resource Types'),
  strategy_canary_enabled: yup.boolean().default(false),
  strategy_canary_default_percentage: yup
    .number()
    .min(0)
    .max(100)
    .when('strategy_canary_enabled', {
      is: true,
      then: (schema) => schema.required().label('Canary Default Percentage'),
      otherwise: (schema) => schema.nullable()
    }),
  strategy_skew_enabled: yup.boolean().default(false),
  strategy_skew_default_ttl_seconds: yup
    .number()
    .min(0)
    .when('strategy_skew_enabled', {
      is: true,
      then: (schema) => schema.required().label('Skew Protection TTL'),
      otherwise: (schema) => schema.nullable()
    })
})

export const initialValues = {
  name: '',
  description: '',
  binding_policy: 'STRICT',
  deployment_version_policy: 'single_version',
  allowed_resource_types: [...ALLOWED_RESOURCE_TYPES],
  strategy_canary_enabled: false,
  strategy_canary_default_percentage: 10,
  strategy_skew_enabled: false,
  strategy_skew_default_ttl_seconds: 3600
}
