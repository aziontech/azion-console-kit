import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { contractSchemas } from '../../../tests/contracts/schemas'

// The canonical fixture tree lives at the repo root (shared by the consumer suite
// and the pre-deploy drift check); the unit runner only includes `src/tests`, so
// resolve the sibling `tests/contracts/fixtures` directory from the Vitest root.
const fixturesDir = resolve(process.cwd(), 'tests/contracts/fixtures')

// A fixture is named `<resourceKey>.version.json`; the key must exist in the
// contract registry so every snapshot is anchored to exactly one response schema.
const resourceKeyFromFile = (fileName) => fileName.replace(/\.version\.json$/, '')

const fixtureFiles = readdirSync(fixturesDir).filter((fileName) =>
  fileName.endsWith('.version.json')
)

const readFixture = (fileName) => JSON.parse(readFileSync(`${fixturesDir}/${fileName}`, 'utf-8'))

// This is the "lying fixture" gate (req 5.3): every committed snapshot MUST match
// the shape the API actually returns, as encoded by `versionResponse`. Editing a
// fixture into a shape the API never emits breaks this test with the yup errors.
describe('contract fixtures — gate against versionResponse', () => {
  it('discovers at least one fixture per registered resource', () => {
    const discoveredKeys = fixtureFiles.map(resourceKeyFromFile).sort()
    expect(discoveredKeys).toEqual(Object.keys(contractSchemas).sort())
  })

  for (const fileName of fixtureFiles) {
    const resourceKey = resourceKeyFromFile(fileName)

    it(`${fileName}: maps to a registered resource schema`, () => {
      expect(
        contractSchemas[resourceKey],
        `no contract schema registered for "${resourceKey}"`
      ).toBeDefined()
    })

    it(`${fileName}: validates against ${resourceKey}.versionResponse`, () => {
      const { versionResponse } = contractSchemas[resourceKey]
      const fixture = readFixture(fileName)

      let validationError = null
      try {
        versionResponse.validateSync(fixture, { strict: true, abortEarly: false })
      } catch (error) {
        validationError = error
      }

      expect(
        validationError,
        validationError
          ? `Fixture "${fileName}" does not match the ${resourceKey} contract:\n- ${validationError.errors?.join('\n- ')}`
          : undefined
      ).toBeNull()
    })
  }
})
