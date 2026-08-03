/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers deployment:J9 component partial
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../')

const read = (relative) => readFileSync(resolve(ROOT, relative), 'utf8')

const FORM_FIELDS_DEPLOYMENT = 'src/views/Deployments/FormFields/FormFieldsDeployment.vue'

describe('FormFieldsDeployment — no version context coupling', () => {
  it('does not import or use useVersionContext', () => {
    const src = read(FORM_FIELDS_DEPLOYMENT)
    expect(src).not.toContain('useVersionContext')
  })

  it('does not reference the version shell readOnly flag', () => {
    const src = read(FORM_FIELDS_DEPLOYMENT)
    expect(src).not.toContain('readOnly')
  })
})
