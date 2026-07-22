import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { contractSchemas } from '../../../../tests/contracts/schemas'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = resolve(CURRENT_DIR, '../../../../tests/contracts/fixtures')

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const deepMerge = (base, override) => {
  if (!isPlainObject(base) || !isPlainObject(override)) return override
  const result = { ...base }
  for (const [key, value] of Object.entries(override)) {
    result[key] =
      isPlainObject(value) && isPlainObject(base[key]) ? deepMerge(base[key], value) : value
  }
  return result
}

const readFixture = (resourceKey) => {
  const path = resolve(FIXTURES_DIR, `${resourceKey}.version.json`)
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test kit: resourceKey comes from the repo-committed registry, not user input
  return JSON.parse(readFileSync(path, 'utf-8'))
}

/**
 * @param {string} resourceKey
 * @param {object} [overrides]
 * @returns {object}
 */
export const buildVersionResponse = (resourceKey, overrides = {}) => {
  const entry = contractSchemas[resourceKey]
  if (!entry) {
    throw new Error(`[builders] no contract schema registered for "${resourceKey}"`)
  }

  const snapshot = deepMerge(readFixture(resourceKey), overrides)
  entry.versionResponse.validateSync(snapshot, { strict: true, abortEarly: false })
  return snapshot
}

const FORM_VALUES = Object.freeze({
  application: { name: 'app', isActive: true, edgeCacheEnabled: true },
  waf: { name: 'waf-main', active: true, sqlInjection: true, sqlInjectionSensitivity: 'high' },
  workload: {
    name: 'my-workload',
    active: true,
    infrastructure: 1,
    workloadHostnameAllowAccess: false,
    useCustomDomain: false,
    customDomain: '',
    domains: [{ subdomain: 'shop', domain: 'example.com' }],
    protocols: {
      http: {
        useHttp3: false,
        useHttps: true,
        httpPorts: [{ value: 80 }],
        httpsPorts: [{ value: 443 }],
        quicPorts: [{ value: 443 }]
      }
    },
    tls: { minimumVersion: 'tls_1_2', ciphers: null },
    mtls: { isEnabled: false, verification: null, certificate: null, crl: null }
  },
  customPage: { name: 'maintenance', active: true, pages: [] },
  edgeFirewall: {
    name: 'edge-firewall-prod',
    isActive: true,
    edgeFunctionsEnabled: true,
    networkProtectionEnabled: false,
    wafEnabled: true,
    ddosProtectionUnmetered: true,
    debugRules: false
  },
  edgeConnector: {
    name: 'storage-connector',
    type: 'storage',
    active: true,
    connectionOptions: { bucket: 'my-bucket', prefix: '/assets' }
  },
  edgeFunction: {
    name: 'my-fn',
    active: true,
    code: 'export default {}',
    runtime: 'javascript',
    executionEnvironment: 'application',
    defaultArgs: '{"foo":"bar"}',
    azionForm: { fields: [] }
  },
  networkList: {
    name: 'ip-list',
    networkListType: 'ip_cidr',
    itemsValues: '10.0.0.0/24\n192.168.0.1',
    itemsValuesCountry: []
  }
})

/**
 * @param {string} resourceKey
 * @returns {object}
 */
export const buildFormValues = (resourceKey) => {
  const values = FORM_VALUES[resourceKey]
  if (!values) {
    throw new Error(
      `[builders] no form values registered for "${resourceKey}" — add them when converting this resource (Phase 2b)`
    )
  }
  return { ...values }
}
