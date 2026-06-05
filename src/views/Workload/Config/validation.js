import * as yup from 'yup'

const subdomainSchema = yup
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
  .label('Subdomain')

const domainSchema = yup
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

const environmentSchema = yup
  .string()
  .nullable()
  .when(['subdomain', 'domain'], {
    is: (subdomain, domain) => !!(subdomain || domain),
    then: (schema) => schema.required('Environment is required for this domain.'),
    otherwise: (schema) => schema.nullable()
  })
  .label('Environment')

// v6: each domain carries its own environment + certificate.
export const domainItemSchema = yup.object({
  id: yup.number(),
  subdomain: subdomainSchema,
  domain: domainSchema,
  environment: environmentSchema,
  certificate: yup.mixed().nullable().notRequired().label('Digital Certificate')
})

// legacy: domains are simple subdomain/domain rows (no environment, no per-domain certificate).
const legacyDomainItemSchema = yup.object({
  id: yup.number(),
  subdomain: subdomainSchema,
  domain: domainSchema
})

const nameSchema = yup
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
  )

// Keys shared by both account types (v6 and legacy).
const baseSchema = {
  name: nameSchema,
  active: yup.boolean(),
  networkMap: yup.string(),
  firewall: yup.number().label('Firewall').nullable(),
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
  workloadHostnameAllowAccess: yup.boolean(),
  letEncrypt: yup.object({
    commonName: yup.string(),
    alternativeNames: yup.array()
  })
}

// v6-only schema fragments.
const v6Extras = {
  // application/firewall flat fields are kept for adapter/deployment compatibility.
  // The per-environment configuration lives in `environmentDeployments`.
  application: yup.number().nullable().notRequired().label('Application'),
  environmentDeployments: yup
    .object()
    .default({})
    .test(
      'all-envs-have-deployment',
      'Each environment in use needs a Deployment Settings linked.',
      function (value) {
        const domains = this.parent.domains || []
        const envIds = [...new Set(domains.map((domain) => domain?.environment).filter(Boolean))]
        return envIds.every((id) => value?.[id]?.deploymentId != null)
      }
    ),
  tls: yup.object({
    isEnabled: yup.boolean(),
    ciphers: yup.string(),
    minimumVersion: yup.string()
  }),
  domains: yup
    .array()
    .of(domainItemSchema)
    .when('workloadHostnameAllowAccess', {
      is: false,
      then: (schema) =>
        schema.test(
          'has-filled-domain',
          'When "Workload Domain Allow Access" switch is off at least one domain is required.',
          (value) => value?.some((domain) => domain.subdomain || domain.domain)
        )
    })
    .when('protocols.http.useHttps', {
      is: true,
      then: (schema) =>
        schema.test(
          'cert-when-https',
          'Each domain needs a certificate when HTTPS is enabled.',
          (rows) =>
            (rows || []).every(
              (domain) => domain?.certificate !== undefined && domain?.certificate !== null
            )
        )
    })
}

// legacy-only schema fragments (mirrors the previous flat form on `dev`).
const legacyExtras = {
  application: yup.number().required().label('Application'),
  tls: yup.object({
    isEnabled: yup.boolean(),
    certificate: yup.string(),
    ciphers: yup.string(),
    minimumVersion: yup.string()
  }),
  domains: yup
    .array()
    .of(legacyDomainItemSchema)
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
            return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(value)
          })
    })
    .label('Custom Domain'),
  authorityCertificate: yup.string().nullable(),
  subjectNameCertificate: yup.array().nullable()
}

/**
 * Builds the Workload form validation schema for the active account type.
 * @param {boolean} isV6 - whether the account has the `use_v6_configurations` flag.
 */
export const buildValidationSchema = (isV6) =>
  yup.object(isV6 ? { ...baseSchema, ...v6Extras } : { ...baseSchema, ...legacyExtras })
