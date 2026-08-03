/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers custom_page:J1 component partial
 * @covers custom_page:J2 component
 * @covers custom_page:J3 component partial
 * @covers custom_page:J4 component
 * @covers custom_page:J5 component partial
 * @covers custom_page:J6 component
 * @covers custom_page:J7 component
 */
import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

const customPage = RESOURCE_TEST_REGISTRY.custom_page
const adapter = customPage.adapter

describeVersionServiceContract(customPage)
describeVersionAdapterContract(customPage)

const rawPage = (code) => ({
  code,
  page: {
    type: 'page_default',
    attributes: { content_type: 'text/html', response: '<h1>hi</h1>', custom_status_code: 404 }
  }
})

describe('custom_page — bespoke: pages[] preserved in the config', () => {
  it('maps every page through transformPageItem, keeping the array', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'AVCPG002',
      state: 'draft',
      name: 'maintenance',
      active: true,
      pages: [rawPage('404'), rawPage('500')]
    })

    expect(result.config.name).toBe('maintenance')
    expect(result.config.pages).toHaveLength(2)
    expect(result.config.pages[0]).toMatchObject({ type: 'page_default' })
  })

  it('carries pages through transformDraftPayload on a PUT', () => {
    const payload = adapter.transformDraftPayload({
      name: 'edited',
      active: false,
      pages: []
    })

    expect(payload).toMatchObject({ name: 'edited', active: false })
    expect(Array.isArray(payload.pages)).toBe(true)
  })
})
