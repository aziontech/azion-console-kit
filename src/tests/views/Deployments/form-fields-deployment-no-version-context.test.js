import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Governance — FormFieldsDeployment is not a versioned form.
 *
 * With the version shell out of the Deployment flow, FormFieldsDeployment.vue is
 * shared only by CreateView and SettingsTab and must ALWAYS be editable. It must
 * NOT consume the version context readOnly flag: it does not appear in
 * VERSIONED_FORM_COMPONENTS (version-readonly-governance.test.js), so any
 * reintroduction of useVersionContext/readOnly here is a regression.
 *
 * This test fails if the form re-couples to the version shell read-only mechanism.
 */
const read = (relative) =>
  readFileSync(fileURLToPath(new URL(`../../../../${relative}`, import.meta.url)), 'utf8')

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
