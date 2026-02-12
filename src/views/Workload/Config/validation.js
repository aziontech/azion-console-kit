import * as yup from 'yup'

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
            return segments.every((segment) =>
              /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(segment)
            )
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

            return segments.every((segment) =>
              /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(segment)
            )
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
          'When "Workload Allow Access" switch is off at least one domain is required.',
          (value) => value?.some((domain) => domain.subdomain || domain.domain)
        )
    })
    .when('tls', {
      is: (value) => {
        return value.certificate === '1'
      },
      then: (schema) =>
        schema.test(
          'has-filled-domain',
          'When Let Encrypt is enabled at least one domain is required.',
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
            return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(value)
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
