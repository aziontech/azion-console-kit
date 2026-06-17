import * as yup from 'yup'

const keyRegex = /^[A-Z0-9_]+$/

export const validationSchema = yup.object({
  name: yup.string().required().label('Name'),
  description: yup.string().nullable().default(''),
  deployment_version_policy: yup
    .string()
    .required()
    .oneOf(['single_version', 'versioned_urls'])
    .label('Deployment Version Policy'),
  globalVariables: yup.array().of(yup.string()).default([]),
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
  deployment_version_policy: 'single_version',
  globalVariables: [],
  environmentVariables: {}
}
