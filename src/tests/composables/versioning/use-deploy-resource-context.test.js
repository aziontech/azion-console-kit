/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application,connector,custom_page,firewall,workload:J8 component
 * @covers deployment:J8 component partial
 * @covers function,network_list,waf:J8 n/a
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

const { route } = vi.hoisted(() => ({ route: { params: {} } }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

const INJECTION_KEY = 'deployResource'

const makeService = (body) => ({
  useListVersionsQuery: vi.fn(() => ({ data: ref({ body }) }))
})

const mountContext = ({
  resourceType,
  resource = { id: 55, name: 'App' },
  currentVersionId,
  versions = []
}) => {
  const versionService = makeService(versions)
  let api
  const Harness = {
    setup() {
      api = useDeployResourceContext({
        resourceType,
        injectionKey: INJECTION_KEY,
        versionService,
        currentVersionId
      })
      return () => null
    }
  }
  mount(Harness, {
    global: { provide: { [INJECTION_KEY]: ref(resource) } }
  })
  return { api: () => api, versionService }
}

beforeEach(() => {
  route.params = {}
})

describe('useDeployResourceContext — capability gating', () => {
  it('yields a null context for a versioned-only resource (no deploy drawer)', () => {
    const { api } = mountContext({ resourceType: 'function', currentVersionId: 'v1' })
    expect(api().resourceContext.value).toBeNull()
  })

  it('builds a context for a deployable resource', () => {
    const { api } = mountContext({
      resourceType: 'application',
      currentVersionId: 'v1',
      versions: [
        { id: 'v-ready', state: 'ready', comment: 'ready one' },
        { id: 'v-draft', state: 'draft' }
      ]
    })

    const context = api().resourceContext.value
    expect(context).toMatchObject({
      resourceType: 'application',
      resourceId: 55,
      resourceName: 'App',
      version: { id: 'v1' }
    })
    expect(context.versions.map((option) => option.id)).toEqual(['v-ready'])
  })
})

describe('useDeployResourceContext — version options', () => {
  it('falls back to the current version alone when nothing is deployable', () => {
    const { api } = mountContext({
      resourceType: 'application',
      currentVersionId: 'v-current',
      versions: [
        { id: 'v-current', state: 'draft', comment: 'editing now' },
        { id: 'v-other', state: 'building' }
      ]
    })

    const { versions } = api().resourceContext.value
    expect(versions).toHaveLength(1)
    expect(versions[0]).toMatchObject({ id: 'v-current', label: 'editing now', isCurrent: true })
  })

  it('offers no versions when there is neither a deployable nor a current version', () => {
    const { api } = mountContext({
      resourceType: 'application',
      currentVersionId: undefined,
      versions: [{ id: 'v-draft', state: 'draft' }]
    })

    const context = api().resourceContext.value
    expect(context.version).toBeNull()
    expect(context.versions).toEqual([])
  })
})

describe('useDeployResourceContext — resource id resolution', () => {
  it('queries versions with the injected resource id', () => {
    const { versionService } = mountContext({
      resourceType: 'application',
      resource: { id: 77, name: 'App' },
      currentVersionId: 'v1'
    })
    expect(versionService.useListVersionsQuery).toHaveBeenCalledWith(77)
  })

  it('falls back to the route param id when the injected resource has none', () => {
    route.params = { id: '88' }
    const { api } = mountContext({
      resourceType: 'application',
      resource: {},
      currentVersionId: 'v1'
    })
    expect(api().resourceContext.value.resourceId).toBe(88)
  })
})
