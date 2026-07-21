import { describe, it, expect } from 'vitest'
// The schemas live in the repo-root `tests/contracts` tree (consumer + drift
// share them); the unit runner only includes `src/tests`, so import across.
import { contractSchemas } from '../../../tests/contracts/schemas'

// Minimal valid fixtures: just the envelope invariants the front depends on
// (identity + a valid state). Deployment keys identity off `id`, not version_id.
const validFixtures = {
  application: { version_id: 'AVAPP01', state: 'draft' },
  workload: { version_id: 'AVWKL01', state: 'ready' },
  customPage: { version_id: 'AVCP001', state: 'draft' },
  edgeFirewall: { version_id: 'AVFW001', state: 'draft' },
  edgeConnector: { version_id: 'AVEC001', state: 'draft' },
  edgeFunction: { version_id: 'AVEF001', state: 'draft' },
  networkList: { version_id: 'AVNL001', state: 'draft' },
  waf: { version_id: 'AVWAF01', state: 'draft' },
  deployment: { id: 'AVDEP01', name: 'v1', state: 'draft', resources: [] }
}

const validateStrict = (schema, data) =>
  schema.validateSync(data, { strict: true, abortEarly: false })

describe('contract schemas — sanity', () => {
  it('registers a schema set for every versioned resource', () => {
    expect(Object.keys(contractSchemas).sort()).toEqual(Object.keys(validFixtures).sort())
  })

  for (const [resource, fixture] of Object.entries(validFixtures)) {
    it(`${resource}: a minimal valid version fixture passes versionResponse`, () => {
      const { versionResponse } = contractSchemas[resource]
      expect(validateStrict(versionResponse, fixture)).toMatchObject(fixture)
    })

    it(`${resource}: an invalid state is rejected by versionResponse`, () => {
      const { versionResponse } = contractSchemas[resource]
      const broken = { ...fixture, state: 'not-a-real-state' }
      expect(() => validateStrict(versionResponse, broken)).toThrow(/one of the 8 canonical states/)
    })
  }
})
