/**
 * Deploy Composer (ReleaseComposerView) — REAL-browser smoke (deep review
 * 2026-07-23: the app's riskiest interactive screen had zero browser
 * coverage). The REAL view mounts with its REAL child tree (composition tree,
 * dependencies, settings picker, impact panel), real Pinia/TanStack/router;
 * the only seams are the two HTTP boundaries, routed by URL with
 * empty-but-shaped fallbacks.
 *
 * @covers *:J8 component partial
 */
import { render } from '@testing-library/vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
// WebkitPlugin mirrors production wiring: it installs webkit's OWN PrimeVue
// config/Toast/Dialog/Tooltip copies — a manually-installed top-level
// ToastService provides a DIFFERENT injection symbol and useToast throws.
import { WebkitPlugin } from '@aziontech/webkit/plugin'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { routeHttpByUrl } from '../support/versioning/boundaries'
import ReleaseComposerView from '@/views/Deployments/v6/ReleaseComposerView.vue'

const trackerStub = () => {
  const chain = { track: () => chain }
  return new Proxy(
    {},
    {
      get: () =>
        new Proxy(chain, { get: (target, prop) => (prop in target ? target[prop] : () => chain) })
    }
  )
}

// Canonical kit seam (spec test-effectiveness req 9.2).
const stubHttpBoundaries = (fixtureRoutes = {}) => routeHttpByUrl(fixtureRoutes)

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/deployments', name: 'deployments', component: { template: '<div />' } },
      {
        path: '/deployments/edit/:id/:tab?',
        name: 'deployments-edit',
        component: { template: '<div />' }
      },
      {
        path: '/deployments/releases/new',
        name: 'release-composer',
        component: ReleaseComposerView
      }
    ]
  })

const mountComposer = async ({ query = {}, fixtures = {} } = {}) => {
  const calls = stubHttpBoundaries(fixtures)
  const router = makeRouter()
  await router.push({ name: 'release-composer', query })
  const utils = render(ReleaseComposerView, {
    global: {
      plugins: [createPinia(), WebkitPlugin, router, VueQueryPlugin],
      provide: { tracker: trackerStub() }
    }
  })
  return { ...utils, calls, router }
}

beforeEach(() => {
  queryClient.clear()
})

describe('Deploy Composer — real-browser smoke', () => {
  it('the full view mounts with its real child tree and loads through the HTTP boundary', async () => {
    const { calls } = await mountComposer()

    expect(document.querySelector('[data-testid="release-composition__view"]')).toBeTruthy()
    expect(
      document.querySelector('[data-testid="release-composition__heading-title"]').textContent
    ).toContain('Review & deploy')
    expect(
      document.querySelector('[data-testid="release-composition__composition-card"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[data-testid="release-composition__deployment-settings-card"]')
    ).toBeTruthy()

    await vi.waitFor(() => {
      expect(
        calls.some((request) => String(request.url).includes('/deployment-api/v4/deployments'))
      ).toBe(true)
    })
  })

  it('the Deploy CTA is DISABLED while the composition cannot be activated (guard observable in the DOM)', async () => {
    await mountComposer()

    const deployButton = document.querySelector(
      '[data-testid="release-composition__build-and-activate"]'
    )
    expect(deployButton).toBeTruthy()
    await vi.waitFor(() => {
      expect(
        deployButton.hasAttribute('disabled') ||
          deployButton.getAttribute('aria-disabled') === 'true'
      ).toBe(true)
    })
  })

  it('a disabled Deploy CTA never opens the confirm dialog on a real click', async () => {
    await mountComposer()

    const deployButton = document.querySelector(
      '[data-testid="release-composition__build-and-activate"]'
    )
    deployButton.click()
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(
      document.body.querySelector('[data-testid="release-composition__confirm-dialog"]')
    ).toBeNull()
  })
})
