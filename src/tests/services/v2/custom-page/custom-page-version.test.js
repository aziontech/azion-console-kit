import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

// Custom Page — registry-driven suite. The inherited service + shared adapter
// contracts run from the descriptor (name/active markers). Bespoke below: the
// `pages[]` snapshot, which is the Custom-Page-specific part of the config.
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
