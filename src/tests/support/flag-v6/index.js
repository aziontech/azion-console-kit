/**
 * flag-v6 Test-Kit (spec flag-v6-coverage, req 8.1/8.3).
 *
 * Toggling the flag ALWAYS goes through the real composable with a real
 * account payload shape — mocking `user-flag.js` is forbidden (it is code
 * under test). The composable keeps state in a module-level ref, so every
 * suite must call `installFlagReset()` (or `resetFlag` in its own beforeEach)
 * to prevent leakage between tests.
 *
 * The HTTP boundary comes from the versioning kit (same seam, no duplication —
 * clean-code/DRY): spyHttpRequest/restoreBoundaries re-exported below.
 */
import { beforeEach, afterEach } from 'vitest'
import { setFeatureFlags } from '@/composables/user-flag'
import { ACCOUNT_WITH_FLAG, ACCOUNT_LEGACY } from './registry'

export { FLAG_NAME, FLAG_FORK_INVENTORY, ACCOUNT_WITH_FLAG, ACCOUNT_LEGACY } from './registry'
export { spyHttpRequest, restoreBoundaries } from '../versioning/boundaries'

/** Turns the flag ON exactly like the app does: real account payload. */
export const flagOn = () => setFeatureFlags(ACCOUNT_WITH_FLAG.client_flags)

/** Turns the flag OFF with a real legacy-account payload. */
export const flagOff = () => setFeatureFlags(ACCOUNT_LEGACY.client_flags)

/** Clears flag state (module-level ref in user-flag.js). */
export const resetFlag = () => setFeatureFlags([])

/** Install per-test flag hygiene for a suite (call at describe top level). */
export const installFlagReset = () => {
  beforeEach(resetFlag)
  afterEach(resetFlag)
}
