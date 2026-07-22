import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { useVersionEditScreen } from '@/composables/versioning/use-version-edit-screen'

const { route, routerPush, routerReplace, toastAdd } = vi.hoisted(() => ({
  route: { params: {} },
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  toastAdd: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: routerPush, replace: routerReplace })
}))
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

const listRoute = (id) => ({ name: 'resource-versions', params: { id } })
const versionRouteName = 'resource-version-edit'

const mountScreen = (configOverrides = {}) => {
  let api
  const Harness = {
    setup() {
      api = useVersionEditScreen({
        load: vi.fn().mockResolvedValue({ name: 'App X' }),
        listRoute,
        versionRouteName,
        ...configOverrides
      })
      return () => null
    }
  }
  const wrapper = mount(Harness)
  return { wrapper, api: () => api }
}

beforeEach(() => {
  route.params = reactive({ id: '10', versionId: 'v1' })
  routerPush.mockClear()
  routerReplace.mockClear()
  toastAdd.mockClear()
})

describe('useVersionEditScreen — route guard + resource load', () => {
  it('redirects to the versions list when the versionId param is missing', () => {
    route.params = reactive({ id: '10' })
    mountScreen()

    expect(routerReplace).toHaveBeenCalledWith({ name: 'resource-versions', params: { id: '10' } })
  })

  it('loads the resource on mount and builds a version-suffixed title', async () => {
    const load = vi.fn().mockResolvedValue({ name: 'App X' })
    const { api } = mountScreen({ load })
    await flushPromises()

    expect(load).toHaveBeenCalledWith('10')
    expect(api().resource.value).toEqual({ name: 'App X' })
    expect(api().isLoading.value).toBe(false)
    expect(api().title.value).toBe('App X — Version v1')
  })

  it('drops the version suffix when titleWithVersion is false (Workload)', async () => {
    const { api } = mountScreen({
      load: vi.fn().mockResolvedValue({ name: 'WL' }),
      titleWithVersion: false
    })
    await flushPromises()

    expect(api().title.value).toBe('WL')
  })

  it('captures the load error and clears the resource', async () => {
    const boom = new Error('load failed')
    const { api } = mountScreen({ load: vi.fn().mockRejectedValue(boom) })
    await flushPromises()

    expect(api().loadError.value).toBe(boom)
    expect(api().resource.value).toBeNull()
    expect(api().isLoading.value).toBe(false)
  })
})

describe('useVersionEditScreen — navigation', () => {
  it('handleCancel pushes the versions list route', async () => {
    const { api } = mountScreen()
    await flushPromises()

    api().handleCancel()
    expect(routerPush).toHaveBeenCalledWith({ name: 'resource-versions', params: { id: '10' } })
  })
})

describe('useVersionEditScreen — command success routing', () => {
  it('DEPLOY opens the release composer via the editor ref (no toast)', async () => {
    const { api } = mountScreen()
    await flushPromises()
    const openRelease = vi.fn()
    api().editorRef.value = { openRelease }

    api().handleCommandSuccess({ action: 'DEPLOY' })

    expect(openRelease).toHaveBeenCalledOnce()
    expect(toastAdd).not.toHaveBeenCalled()
  })

  it('DEPLOY falls through to a toast when the resource has no deploy drawer', async () => {
    const { api } = mountScreen({ supportsDeployDrawer: false })
    await flushPromises()
    const openRelease = vi.fn()
    api().editorRef.value = { openRelease }

    api().handleCommandSuccess({ action: 'DEPLOY' })

    expect(openRelease).not.toHaveBeenCalled()
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
  })

  it('SAVE_AND_BUILD toasts success and returns to the versions list', async () => {
    const { api } = mountScreen()
    await flushPromises()

    api().handleCommandSuccess({ action: 'SAVE_AND_BUILD' })

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Build started' })
    )
    expect(routerPush).toHaveBeenCalledWith({ name: 'resource-versions', params: { id: '10' } })
  })

  it('NEW_DRAFT_FROM navigates to the newly created version', async () => {
    const { api } = mountScreen()
    await flushPromises()

    api().handleCommandSuccess({ action: 'NEW_DRAFT_FROM', result: { id: 'v-new' } })

    expect(routerPush).toHaveBeenCalledWith({
      name: versionRouteName,
      params: { id: '10', versionId: 'v-new' }
    })
  })

  it('SAVE reloads the resource in place (no navigation)', async () => {
    const load = vi.fn().mockResolvedValue({ name: 'App X' })
    const { api } = mountScreen({ load })
    await flushPromises()
    expect(load).toHaveBeenCalledTimes(1)

    api().handleCommandSuccess({ action: 'SAVE' })
    await flushPromises()

    expect(load).toHaveBeenCalledTimes(2)
    expect(routerPush).not.toHaveBeenCalled()
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Version saved' }))
  })
})

describe('useVersionEditScreen — command error handling', () => {
  it('delegates to error.showErrors when the rejection carries it', async () => {
    const { api } = mountScreen()
    await flushPromises()
    const showErrors = vi.fn()

    api().handleCommandError({ error: { showErrors } })

    expect(showErrors).toHaveBeenCalledOnce()
    expect(toastAdd).not.toHaveBeenCalled()
  })

  it('surfaces a generic error toast with the message detail', async () => {
    const { api } = mountScreen()
    await flushPromises()

    api().handleCommandError({ error: new Error('nope') })

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Error', detail: 'nope' })
    )
  })
})
