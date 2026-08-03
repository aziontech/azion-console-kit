/**
 * Legacy-smoke contract (spec flag-v6-coverage, req 6.1 / ADR-6) — proves the
 * LEGACY flow OPERATES with the flag OFF, per resource:
 *
 *   1. The route fork resolves the legacy view (real factory, flag OFF).
 *   2. The view MOUNTS with the real wiring the route provides (route props,
 *      real services) — only true boundaries stubbed: both HTTP seams
 *      (httpService for v2, AxiosHttpClientAdapter for v1), TanStack cache,
 *      analytics tracker, toast/router shells.
 *   3. The view fires its REAL load through the HTTP boundary (descriptor
 *      fixture answers) and RENDERS the loaded data.
 *
 * Scope note (registered in tasks.md): this is an OPERATE smoke (mount + load
 * + render). Full per-resource save journeys belong to the test-maturity
 * front.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import DialogService from 'primevue/dialogservice'
import Tooltip from 'primevue/tooltip'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { flagOff, installFlagReset } from '../../support/flag-v6'
import { routeHttpByUrl } from '../../support/versioning/boundaries'
import { findRoute, resolveRouteProps } from '../../support/flag-v6/route-tools'

const RESOURCE_ID = '123'

// Analytics tracker is an external boundary — inert double with the real API.
const trackerStub = () => {
  const chain = { track: () => chain }
  return new Proxy(
    {},
    {
      get: () =>
        new Proxy(chain, {
          get: (target, prop) => (prop in target ? target[prop] : () => chain)
        })
    }
  )
}

const stubQueryCache = () => {
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn } = {}) =>
    typeof queryFn === 'function' ? queryFn() : undefined
  )
  vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
  vi.spyOn(queryClient, 'prefetchQuery').mockImplementation(() => Promise.resolve())
}

// Routes BOTH HTTP boundaries by URL fragment; unmatched requests get an
// empty-but-shaped answer so ancillary calls never crash the smoke.
// Canonical kit seam (spec test-effectiveness req 9.2) — raw: entries carry
// the full seam response verbatim.
const stubHttpBoundaries = (fixtureRoutes) => routeHttpByUrl(fixtureRoutes, { raw: true })

export const describeLegacySmoke = ({
  resource,
  routeFile,
  routeName,
  fixtureRoutes,
  loadUrlFragment,
  expectRendered
}) => {
  describe(`legacy smoke — ${resource} (flag OFF)`, () => {
    installFlagReset()

    let record

    beforeEach(() => {
      flagOff()
      record = findRoute(routeFile, routeName)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    const mountLegacyView = async () => {
      const calls = stubHttpBoundaries(fixtureRoutes)
      stubQueryCache()

      const view = await record.component()

      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/smoke/:id/:tab?',
            name: routeName,
            meta: record.meta ?? {},
            component: view.default
          },
          { path: '/:pathMatch(.*)*', name: 'catch-all', component: { render: () => null } }
        ]
      })
      router.push(`/smoke/${RESOURCE_ID}`)
      await router.isReady()

      const pinia = createPinia()
      setActivePinia(pinia)

      const routeLocation = router.currentRoute.value
      const wrapper = mount(view.default, {
        props: resolveRouteProps(record, routeLocation),
        global: {
          plugins: [pinia, PrimeVue, ToastService, DialogService, router],
          directives: { tooltip: Tooltip },
          provide: { tracker: trackerStub() },
          stubs: { teleport: true }
        }
      })

      // Let the mounted load settle through the stubbed boundary.
      await vi.waitFor(() => {
        expect(calls.some((request) => request.url.includes(loadUrlFragment))).toBe(true)
      })
      await vi.dynamicImportSettled()

      return { wrapper, calls }
    }

    it('resolves the LEGACY view from the real route factory', async () => {
      const view = await record.component()

      expect(view.default, 'legacy view must resolve with the flag OFF').toBeTruthy()
    })

    it('mounts, fires the real load through the HTTP boundary and renders the data', async () => {
      const { wrapper } = await mountLegacyView()

      await vi.waitFor(() => {
        expect(wrapper.html()).toContain(expectRendered)
      })
    })
  })
}
