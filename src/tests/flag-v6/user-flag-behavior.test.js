// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  setFeatureFlags,
  hasFlagUseV6Configurations,
  useFlag,
  USE_V6_CONFIGURATIONS
} from '@/composables/user-flag'
import {
  ACCOUNT_WITH_FLAG,
  ACCOUNT_LEGACY,
  flagOn,
  flagOff,
  installFlagReset
} from '../support/flag-v6'

/**
 * Flag behavior (spec flag-v6-coverage, req 1) — the REAL composable with REAL
 * account payload shapes. The safe default is the LEGACY flow: any degenerate
 * payload must read as flag OFF (req 1.3). Pure logic → node environment.
 */
installFlagReset()

describe('use_v6_configurations — reading the flag from a real account payload', () => {
  it('reads ON when client_flags contains the flag (req 1.1)', () => {
    setFeatureFlags(ACCOUNT_WITH_FLAG.client_flags)

    expect(hasFlagUseV6Configurations()).toBe(true)
    expect(useFlag(USE_V6_CONFIGURATIONS).value).toBe(true)
  })

  it('reads OFF for a legacy account (flag absent — req 1.2)', () => {
    setFeatureFlags(ACCOUNT_LEGACY.client_flags)

    expect(hasFlagUseV6Configurations()).toBe(false)
    expect(useFlag(USE_V6_CONFIGURATIONS).value).toBe(false)
  })

  it('reads OFF when the account has OTHER flags but not this one', () => {
    setFeatureFlags(['block_apiv4_incompatible_endpoints', 'some_other_flag'])

    expect(hasFlagUseV6Configurations()).toBe(false)
  })
})

describe('use_v6_configurations — degenerate payloads default to the LEGACY flow (req 1.3)', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a plain string', 'use_v6_configurations'],
    ['an object', { use_v6_configurations: true }],
    ['a number', 1]
  ])('reads OFF when client_flags is %s', (label, malformed) => {
    setFeatureFlags(malformed)

    expect(hasFlagUseV6Configurations()).toBe(false)
  })
})

describe('use_v6_configurations — account switch in the same session (req 1.4)', () => {
  it('follows the CURRENT account with no residue from the previous one', () => {
    flagOn()
    expect(hasFlagUseV6Configurations()).toBe(true)

    // Switch to a legacy account: the previous ON state must not linger.
    flagOff()
    expect(hasFlagUseV6Configurations()).toBe(false)

    // Switch back: reads ON again — the ref follows setFeatureFlags exactly.
    flagOn()
    expect(hasFlagUseV6Configurations()).toBe(true)
  })

  it('a reactive useFlag() computed follows the account switch live', () => {
    const flag = useFlag(USE_V6_CONFIGURATIONS)

    flagOn()
    expect(flag.value).toBe(true)

    flagOff()
    expect(flag.value).toBe(false)
  })
})
