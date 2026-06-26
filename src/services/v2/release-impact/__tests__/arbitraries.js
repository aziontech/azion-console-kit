/**
 * fast-check arbitraries for the release-impact PBTs (Property 1 / Property 6,
 * tasks 3.2 / 3.4). These generate v6 workloads, bindings and environment maps
 * shaped exactly like {@link ./fixtures.js}.
 *
 * fast-check is NOT yet a devDependency of this repo (see task 1.2 blockers).
 * To keep the harness importable today, fast-check is loaded LAZILY and the
 * arbitrary factories throw a clear, actionable error if it is missing. Each
 * factory receives the `fc` module so PBT specs can do:
 *
 *   import fc from 'fast-check'
 *   import { workloadArb } from './arbitraries'
 *   fc.assert(fc.property(workloadArb(fc), (wl) => { ... }), { numRuns: 100 })
 *
 * Once fast-check is installed, these factories work unchanged.
 */

const ENVIRONMENT_IDS = ['env-prod', 'env-stg', 'env-dev', 'env-orphan']
const DEPLOYMENT_IDS = ['ds-1', 'ds-2', 'ds-3', 'ds-4']

const requireFc = (fc) => {
  if (!fc || typeof fc.record !== 'function') {
    throw new Error(
      'fast-check is required for release-impact property-based tests. ' +
        'Pass the imported `fc` module to the arbitrary factory, e.g. workloadArb(fc). ' +
        'If the import fails, fast-check is not yet installed (see spec task 1.2 blockers).'
    )
  }
  return fc
}

/** A domain string arbitrary. */
export const domainArb = (fc) => {
  requireFc(fc)
  return fc
    .tuple(
      fc.constantFrom('shop', 'api', 'pay', 'mkt', 'app', 'www'),
      fc.constantFrom('example.com', 'azion.app')
    )
    .map(([sub, base]) => `${sub}.${base}`)
}

/** An environment_id arbitrary (may include an id absent from the env map). */
export const environmentIdArb = (fc) => {
  requireFc(fc)
  return fc.constantFrom(...ENVIRONMENT_IDS)
}

/**
 * A binding arbitrary using ONLY the three guaranteed fields. `deployment_id`
 * may be null (binding not attributable to a DS — must be skipped downstream).
 */
export const bindingArb = (fc, { allowNullDeployment = true } = {}) => {
  requireFc(fc)
  const deploymentIdArb = allowNullDeployment
    ? fc.option(fc.constantFrom(...DEPLOYMENT_IDS), { nil: null })
    : fc.constantFrom(...DEPLOYMENT_IDS)

  return fc.record({
    deployment_id: deploymentIdArb,
    environment_id: fc.option(environmentIdArb(fc), { nil: null }),
    domains: fc.array(domainArb(fc), { maxLength: 5 })
  })
}

/**
 * A workload arbitrary in the transformed-list shape, with
 * `active: { content: 'Active' | 'Inactive' }` and `bindings[]`.
 */
export const workloadArb = (fc) => {
  requireFc(fc)
  return fc.record({
    id: fc.uuid(),
    name: fc.record({
      text: fc.string({ minLength: 1, maxLength: 20 }),
      tagProps: fc.constant({})
    }),
    active: fc
      .boolean()
      .map((isActive) =>
        isActive
          ? { content: 'Active', severity: 'success' }
          : { content: 'Inactive', severity: 'danger' }
      ),
    bindings: fc.array(bindingArb(fc), { maxLength: 4 })
  })
}

/** A workloads-list arbitrary (the array consumers iterate). */
export const workloadsListArb = (fc, { maxLength = 8 } = {}) => {
  requireFc(fc)
  return fc.array(workloadArb(fc), { maxLength })
}

/**
 * An `envNameById` Map arbitrary covering a subset of environment ids, so PBTs
 * can assert that ids absent from the map resolve to a null name (never
 * fabricated).
 */
export const envNameMapArb = (fc) => {
  requireFc(fc)
  return fc
    .subarray(ENVIRONMENT_IDS.filter((id) => id !== 'env-orphan'))
    .map((ids) => new Map(ids.map((id) => [id, `Name of ${id}`])))
}
