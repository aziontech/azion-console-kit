import * as yup from 'yup'

// DNS label rule: 1-63 chars, start & end alphanumeric, hyphens allowed in the middle.
// Implemented as a multi-step check so each underlying regex is star-height 1
// (avoids the nested-quantifier shape rejected by `security/detect-unsafe-regex`).
const DNS_LABEL_BODY_REGEX = /^[a-zA-Z0-9-]+$/
const DNS_LABEL_START_REGEX = /^[a-zA-Z0-9]/
const DNS_LABEL_END_REGEX = /[a-zA-Z0-9]$/

const isValidDnsLabel = (value) => {
  if (!value || value.length > 63) return false
  if (!DNS_LABEL_START_REGEX.test(value)) return false
  if (value.length > 1 && !DNS_LABEL_END_REGEX.test(value)) return false
  return DNS_LABEL_BODY_REGEX.test(value)
}

export const validationSchema = yup.object({
  name: yup
    .string()
    .label('Name')
    .required()
    .test(
      'only-ascii',
      'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
      function (value) {
        const nameRegex = /^[\x20-\x21\x23-\x7E]+$/
        return nameRegex.test(value)
      }
    ),
  application: yup.number().required().label('Application'),
  active: yup.boolean(),
  networkMap: yup.string(),
  firewall: yup.number().label('Firewall').nullable(),
  tls: yup.object({
    isEnabled: yup.boolean(),
    certificate: yup.string(),
    ciphers: yup.string(),
    minimumVersion: yup.string()
  }),
  protocols: yup.object({
    http: yup.object({
      useHttps: yup.boolean(),
      useHttp3: yup.boolean(),
      versions: yup.array(),
      httpPorts: yup.array().when('useHttp3', {
        is: true,
        then: (schema) => schema.min(1, 'At least one port is required'),
        otherwise: (schema) => schema.notRequired()
      }),
      httpsPorts: yup.array().when('useHttps', {
        is: true,
        then: (schema) => schema.min(1, 'At least one port is required'),
        otherwise: (schema) => schema.notRequired()
      }),
      quicPorts: yup.array().when('useHttp3', {
        is: true,
        then: (schema) => schema.min(1, 'At least one port is required'),
        otherwise: (schema) => schema.notRequired()
      })
    })
  }),
  mtls: yup.object({
    isEnabled: yup.boolean(),
    verification: yup.string().nullable().notRequired().label('Verification'),
    certificate: yup
      .string()
      .when('isEnabled', {
        is: true,
        then: (schema) => schema.required('Trusted CA Certificate is required'),
        otherwise: (schema) => schema.notRequired().nullable()
      })
      .label('Trusted CA Certificate'),
    crl: yup.array().label('Certificate Revocation List').nullable()
  }),
  domains: yup
    .array()
    .of(
      yup.object({
        id: yup.number(),
        subdomain: yup
          .string()
          .test('valid-subdomain', 'Invalid Subdomain format', function (value) {
            if (!value) return true

            if (value === '*') return true

            if (value.endsWith('.')) return false

            const dotCount = (value.match(/\./g) || []).length
            if (dotCount > 10) return false
            const segments = value.split('.')
            return segments.every(isValidDnsLabel)
          })
          .label('Subdomain'),
        domain: yup
          .string()
          .test('valid-domain', 'Invalid Domain format ', function (value) {
            if (!value) {
              return true
            }

            if (value.endsWith('.')) {
              return false
            }

            const segments = value.split('.')
            const dotCount = segments.length - 1
            if (dotCount < 1 || dotCount > 10) {
              return false
            }

            return segments.every(isValidDnsLabel)
          })
          .label('Domain')
      })
    )
    .when(['workloadHostnameAllowAccess', 'useCustomDomain'], {
      is: (workloadHostnameAllowAccess, useCustomDomain) =>
        workloadHostnameAllowAccess === false && useCustomDomain === false,
      then: (schema) =>
        schema.test(
          'has-filled-domain',
          'When "Workload Domain Allow Access" switch is off at least one domain is required.',
          (value) => value?.some((domain) => domain.subdomain || domain.domain)
        )
    })
    .when('tls', {
      is: (value) => {
        return value.certificate === '1' || value.certificate === '2'
      },
      then: (schema) =>
        schema.test(
          'has-filled-domain',
          "Domain is required when using a Let's Encrypt certificate.",
          (value) => value?.some((domain) => domain.domain)
        )
    }),
  useCustomDomain: yup.boolean(),
  customDomain: yup
    .string()
    .when('useCustomDomain', {
      is: true,
      then: (schema) =>
        schema
          .required()
          .test('valid-custom-domain', 'Invalid custom domain format', function (value) {
            if (!value) return true // Allow empty hostname
            return isValidDnsLabel(value)
          })
    })
    .label('Custom Domain'),
  workloadHostnameAllowAccess: yup.boolean(),
  letEncrypt: yup.object({
    commonName: yup.string(),
    alternativeNames: yup.array()
  }),
  authorityCertificate: yup.string().nullable(),
  subjectNameCertificate: yup.array().nullable()
})
