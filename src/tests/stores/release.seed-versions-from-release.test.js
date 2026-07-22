import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useReleaseStore } from '@/stores/release'
import { LATEST_READY } from '@/templates/release-composition/version-options'

const APPLICATION_TYPE = 'application'
const DS_ID = 'ds-1'

const release = (resources) => ({ resources })

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('seedVersionsFromRelease — singletons', () => {
  it('seeds resVers[type] with the option value (native type) when the pin matches the catalog', () => {
    const store = useReleaseStore()
    store.setActiveReleaseByDs(
      DS_ID,
      release([{ resource_type: APPLICATION_TYPE, global_id: 'app-1', version_id: '42' }])
    )
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [
      { value: 7, isCurrent: false },
      { value: 42, isCurrent: false }
    ])

    store.seedVersionsFromRelease(DS_ID)

    expect(store.resVers[APPLICATION_TYPE]).toBe(42)
  })

  it('does not seed when the pin is not present in the loaded catalog (silent fallback)', () => {
    const store = useReleaseStore()
    store.setActiveReleaseByDs(
      DS_ID,
      release([{ resource_type: APPLICATION_TYPE, global_id: 'app-1', version_id: 'v-gone' }])
    )
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [{ value: 'v-1', isCurrent: true }])

    store.seedVersionsFromRelease(DS_ID)

    expect(store.resVers[APPLICATION_TYPE]).toBeUndefined()
  })

  it('never overwrites a resVers slot the user (or a prior seed) already set — a concrete id', () => {
    const store = useReleaseStore()
    store.setActiveReleaseByDs(
      DS_ID,
      release([{ resource_type: APPLICATION_TYPE, global_id: 'app-1', version_id: 'v-1' }])
    )
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [{ value: 'v-1', isCurrent: true }])
    store.setResVer(APPLICATION_TYPE, 'user-picked-id')

    store.seedVersionsFromRelease(DS_ID)

    expect(store.resVers[APPLICATION_TYPE]).toBe('user-picked-id')
  })

  it('never overwrites a resVers slot explicitly set to LATEST_READY (Track latest Ready)', () => {
    const store = useReleaseStore()
    store.setActiveReleaseByDs(
      DS_ID,
      release([{ resource_type: APPLICATION_TYPE, global_id: 'app-1', version_id: 'v-1' }])
    )
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [{ value: 'v-1', isCurrent: true }])
    store.setResVer(APPLICATION_TYPE, LATEST_READY)

    store.seedVersionsFromRelease(DS_ID)

    expect(store.resVers[APPLICATION_TYPE]).toBe(LATEST_READY)
  })
})

describe('seedVersionsFromRelease — dependencies', () => {
  it('seeds a version==null instance with a release+catalog match; leaves a no-match instance null; leaves an off-catalog pin null', () => {
    const store = useReleaseStore()
    store.seedApplicationFunctions([
      { functionId: 'fn-1' },
      { functionId: 'fn-2' },
      { functionId: 'fn-3' }
    ])
    store.setActiveReleaseByDs(
      DS_ID,
      release([
        { resource_type: 'function', resource_id: 'fn-1', version_id: 'fn-1-v2' },
        { resource_type: 'function', resource_id: 'fn-3', version_id: 'fn-3-v-gone' }
      ])
    )
    store.setVersionsByResource('function', 'fn-1', [{ value: 'fn-1-v2', isCurrent: true }])
    store.setVersionsByResource('function', 'fn-3', [{ value: 'fn-3-v1', isCurrent: true }])

    store.seedVersionsFromRelease(DS_ID)

    expect(store.coll.application.function[0]).toMatchObject({
      resourceId: 'fn-1',
      version: 'fn-1-v2'
    })
    expect(store.coll.application.function[1]).toMatchObject({ resourceId: 'fn-2', version: null })
    expect(store.coll.application.function[2]).toMatchObject({ resourceId: 'fn-3', version: null })
  })

  it('propagates a seeded shared-type instance (connector) to every parent that references it', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])
    store.setActiveReleaseByDs(
      DS_ID,
      release([{ resource_type: 'connector', resource_id: 'cn-1', version_id: 'cn-1-v9' }])
    )
    store.setVersionsByResource('connector', 'cn-1', [{ value: 'cn-1-v9', isCurrent: true }])

    store.seedVersionsFromRelease(DS_ID)

    expect(store.coll.application.connector[0].version).toBe('cn-1-v9')
    expect(store.coll.custom_page.connector[0].version).toBe('cn-1-v9')
  })
})

describe('seedVersionsFromRelease — idempotency', () => {
  it('a second call with the same state makes no further change', () => {
    const store = useReleaseStore()
    store.seedApplicationFunctions([{ functionId: 'fn-1' }])
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.setActiveReleaseByDs(
      DS_ID,
      release([
        { resource_type: APPLICATION_TYPE, global_id: 'app-1', version_id: 'app-v1' },
        { resource_type: 'function', resource_id: 'fn-1', version_id: 'fn-1-v1' },
        { resource_type: 'connector', resource_id: 'cn-1', version_id: 'cn-1-v1' }
      ])
    )
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [{ value: 'app-v1', isCurrent: true }])
    store.setVersionsByResource('function', 'fn-1', [{ value: 'fn-1-v1', isCurrent: true }])
    store.setVersionsByResource('connector', 'cn-1', [{ value: 'cn-1-v1', isCurrent: true }])

    store.seedVersionsFromRelease(DS_ID)
    const before = JSON.stringify(store.$state)

    store.seedVersionsFromRelease(DS_ID)
    const after = JSON.stringify(store.$state)

    expect(after).toBe(before)
  })
})

describe('seedVersionsFromRelease — composeResources reflects the seeded pin', () => {
  it('resource_version is the concrete pin, not a LATEST-resolved id', () => {
    const store = useReleaseStore()
    store.openRelease({ deploymentIds: [DS_ID] })
    store.setActiveReleaseByDs(
      DS_ID,
      release([{ resource_type: APPLICATION_TYPE, global_id: 'app-1', version_id: 'app-v1' }])
    )
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [
      { value: 'app-v1', isCurrent: false },
      { value: 'app-v2', isCurrent: true }
    ])

    store.seedVersionsFromRelease(DS_ID)

    const appEntry = store
      .composeResources()
      .find((resource) => resource.resource_type === APPLICATION_TYPE)

    expect(appEntry.resource_version).toBe('app-v1')
  })
})
