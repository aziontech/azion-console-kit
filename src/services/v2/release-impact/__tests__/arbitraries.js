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

export const domainArb = (fc) => {
  requireFc(fc)
  return fc
    .tuple(
      fc.constantFrom('shop', 'api', 'pay', 'mkt', 'app', 'www'),
      fc.constantFrom('example.com', 'azion.app')
    )
    .map(([sub, base]) => `${sub}.${base}`)
}

export const environmentIdArb = (fc) => {
  requireFc(fc)
  return fc.constantFrom(...ENVIRONMENT_IDS)
}

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

export const workloadsListArb = (fc, { maxLength = 8 } = {}) => {
  requireFc(fc)
  return fc.array(workloadArb(fc), { maxLength })
}

export const envNameMapArb = (fc) => {
  requireFc(fc)
  return fc
    .subarray(ENVIRONMENT_IDS.filter((id) => id !== 'env-orphan'))
    .map((ids) => new Map(ids.map((id) => [id, `Name of ${id}`])))
}
