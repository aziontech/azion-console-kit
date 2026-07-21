import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { contractSchemas } from '../../../../tests/contracts/schemas'

/**
 * Test-kit — fixture builders. One place to construct a valid version snapshot or
 * a realistic form-values object, replacing the inline fixtures scattered across
 * adapter/service tests.
 *
 * A built snapshot is loaded from the canonical fixture tree and VALIDATED against
 * the resource's `versionResponse` yup schema on construction: an invalid fixture
 * (or an override that breaks the contract) THROWS here, turning the fixture-gate
 * from runtime vigilance into a construction-time guarantee.
 */

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
// support/versioning -> tests/contracts/fixtures at the repo root (4 levels up).
const FIXTURES_DIR = resolve(CURRENT_DIR, '../../../../tests/contracts/fixtures')

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Deep-merges plain objects (arrays and primitives replace). Used so an override
 * can tweak a nested field (e.g. `modules.cache.enabled`) without restating the
 * whole branch, while `thresholds: [...]` still replaces the array wholesale.
 */
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
 * Builds a version-response snapshot for a resource from its canonical fixture,
 * applies `overrides` (top-level shallow, deep for nested plain objects) and
 * validates the result against `contractSchemas[resourceKey].versionResponse`
 * (strict). Throws if the resource is unknown or the result violates the contract.
 *
 * @param {string} resourceKey contract key (e.g. `application`, `waf`)
 * @param {object} [overrides] fields to merge onto the fixture
 * @returns {object} a validated raw version snapshot (API shape)
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

/**
 * Realistic UI form values per resource, extracted from the existing service/
 * adapter tests. These are what a form child hands to `updateDraft`/`createDraft`
 * (the shared adapter contract maps them back to the root payload).
 */
const FORM_VALUES = Object.freeze({
  application: { name: 'app', isActive: true, edgeCacheEnabled: true },
  waf: { name: 'waf-main', active: true, sqlInjection: true, sqlInjectionSensitivity: 'high' },
  // Legacy workload edit form (flat domains, no bindings); transformCreateWorkload
  // reads each of these. Config markers asserted from the fixture are flag-independent.
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
  // Storage variant (simplest of the three connector types) for the shared payload
  // contract; the HTTP/LiveIngest polymorphism is proven bespoke in the resource file.
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
 * Returns a fresh copy of the realistic form values for a resource.
 *
 * @param {string} resourceKey contract key (e.g. `application`, `waf`)
 * @returns {object} form values in the UI shape
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
