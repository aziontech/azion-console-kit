import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

const firewall = RESOURCE_TEST_REGISTRY.firewall
const adapter = firewall.adapter

describeVersionServiceContract(firewall)
describeVersionAdapterContract(firewall)

describe('edge-firewall — bespoke: nested modules snapshot + partial config', () => {
  it('reads module flags from the nested `modules` object shape', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'AVFW0003',
      state: 'draft',
      name: 'nested-fw',
      active: true,
      debug: true,
      modules: {
        ddos_protection: { enabled: true },
        functions: { enabled: false },
        network_protection: { enabled: true },
        waf: { enabled: false }
      }
    })

    expect(result.config).toEqual({
      name: 'nested-fw',
      isActive: true,
      edgeFunctionsEnabled: false,
      networkProtectionEnabled: true,
      wafEnabled: false,
      ddosProtectionUnmetered: true,
      debugRules: true
    })
  })

  it('omits config keys absent from the raw snapshot', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'X',
      state: 'draft',
      name: 'only-name'
    })

    expect(result.config).toEqual({ name: 'only-name' })
  })

  it('maps a partial draft payload to the nested modules shape, stripping undefined', () => {
    const payload = adapter.transformDraftPayload({ name: 'fw', wafEnabled: true })

    expect(payload).toEqual({ name: 'fw', modules: { waf: { enabled: true } } })
    expect(payload).not.toHaveProperty('active')
  })
})
