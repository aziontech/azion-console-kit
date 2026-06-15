import * as yup from 'yup'

export const validationSchema = yup.object({
  name: yup.string().required().min(3).max(255).label('Name'),
  description: yup.string().nullable().default(''),
  binding_policy: yup.string().required().oneOf(['STRICT', 'FLEXIBLE']).label('Binding Policy'),
  deployment_policy: yup
    .string()
    .required()
    .oneOf(['single_version', 'versioned_urls'])
    .label('Deployment Version Policy'),
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
  deployment_policy: 'single_version',
  strategy_canary_enabled: false,
  strategy_canary_default_percentage: 10,
  strategy_skew_enabled: false,
  strategy_skew_default_ttl_seconds: 3600
}
