import * as yup from 'yup'

const keyRegex = /^[A-Z0-9_]+$/

export const validationSchema = yup.object({
  name: yup.string().required().label('Name'),
  description: yup.string().nullable().default(''),
  deployment_policy: yup
    .string()
    .required()
    .oneOf(['single_version', 'versioned_urls'])
    .label('Deployment Version Policy'),
  log_verbosity: yup.string().oneOf(['normal', 'verbose']).default('normal').label('Log Verbosity'),
  robots_policy: yup.string().oneOf(['index', 'noindex']).default('index').label('Robots Policy'),
  protection: yup.object({
    azion_authentication: yup.object({
      enabled: yup.boolean().default(false)
    }),
    password_protection: yup.object({
      enabled: yup.boolean().default(false),
      secret_id: yup.string().nullable().default(null).label('Secret')
    }),
    ip_allowlist: yup.object({
      enabled: yup.boolean().default(false),
      cidrs: yup.string().nullable().default('').label('IPs/CIDRs')
    }),
    sso_enforcement: yup.object({
      enabled: yup.boolean().default(false),
      idp_id: yup.string().nullable().default(null).label('Identity Provider'),
      allowed_domains: yup.array().of(yup.string()).default([]).label('Allowed Domains')
    })
  }),
  branch_tracking: yup.object({
    enabled: yup.boolean().default(false),
    mode: yup.string().when('enabled', {
      is: true,
      then: (schema) =>
        schema
          .required()
          .oneOf(['branch_is', 'branch_starts_with', 'branch_ends_with'])
          .label('Mode'),
      otherwise: (schema) => schema.nullable()
    }),
    branch_match: yup.string().when('enabled', {
      is: true,
      then: (schema) => schema.required().label('Branch Match'),
      otherwise: (schema) => schema.nullable()
    })
  }),
  environmentVariables: yup
    .object()
    .label('Environment Variables')
    .default({})
    .test(
      'valid-environment-variables',
      'Environment Variables must be a key/value object with string values',
      (value) => {
        if (!value) return true
        if (typeof value !== 'object' || Array.isArray(value)) return false

        return Object.keys(value).every((key) => {
          const itemValue = value[key]
          return keyRegex.test(key.trim()) && typeof itemValue === 'string'
        })
      }
    )
})

export const initialValues = {
  name: '',
  description: '',
  deployment_policy: 'single_version',
  log_verbosity: 'normal',
  robots_policy: 'index',
  protection: {
    azion_authentication: { enabled: false },
    password_protection: { enabled: false, secret_id: null },
    ip_allowlist: { enabled: false, cidrs: '' },
    sso_enforcement: { enabled: false, idp_id: null, allowed_domains: [] }
  },
  branch_tracking: { enabled: false, mode: 'branch_starts_with', branch_match: '' },
  environmentVariables: {}
}
