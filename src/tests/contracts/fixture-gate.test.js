import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { contractSchemas } from '../../../tests/contracts/schemas'

const fixturesDir = resolve(process.cwd(), 'tests/contracts/fixtures')

const resourceKeyFromFile = (fileName) => fileName.replace(/\.version\.json$/, '')

const fixtureFiles = readdirSync(fixturesDir).filter((fileName) =>
  fileName.endsWith('.version.json')
)

const readFixture = (fileName) => JSON.parse(readFileSync(`${fixturesDir}/${fileName}`, 'utf-8'))

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
