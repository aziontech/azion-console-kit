/**
 * Route-fork contract (spec flag-v6-coverage, req 2 / ADR-2) — parametrized
 * over FLAG_FORK_INVENTORY.routes descriptors. NOT collected by vitest
 * directly (.contract.js): instantiated by src/tests/flag-v6/route-fork.test.js.
 *
 * BEHAVIORAL proof, zero mocks: with the flag set through the real composable,
 * the suite executes the route's REAL component factory (`route.component()`)
 * and asserts MODULE IDENTITY — the resolved module must be the exact same
 * module object as the expected view (flag ON → v6 view, OFF → legacy view).
 * Identity beats filename matching: the module cache guarantees `.default` is
 * the same object only when the factory imported that precise file.
 */
import { describe, it, expect } from 'vitest'
import { flagOn, flagOff, installFlagReset } from '../../support/flag-v6'

// Route definitions: eager (cheap — route files only import services/helpers).
const routeModules = import.meta.glob('/src/router/routes/*/index.js', { eager: true })
// Views: LAZY — only the ~28 views referenced by inventory forks are loaded.
const viewModules = import.meta.glob('/src/views/**/*.vue')

const flattenRoutes = (node) => [node, ...(node.children ?? []).flatMap(flattenRoutes)]

const findRoute = (routeFile, routeName) => {
  const mod = routeModules[`/${routeFile}`]
  if (!mod) throw new Error(`route file not found by glob: ${routeFile}`)
  const roots = Object.values(mod).filter((value) => value && typeof value === 'object')
  const route = roots.flatMap(flattenRoutes).find((record) => record.name === routeName)
  if (!route) throw new Error(`route "${routeName}" not found in ${routeFile}`)
  return route
}

// '@views/X.vue' | '@/views/X.vue' → '/src/views/X.vue' (the glob key shape).
const toViewKey = (spec) =>
  spec.replace(/^@views\//, '/src/views/').replace(/^@\/views\//, '/src/views/')

const loadExpectedView = async (spec) => {
  const loader = viewModules[toViewKey(spec)]
  if (!loader) throw new Error(`inventory view does not exist on disk: ${spec}`)
  return loader()
}

// Runs the route's REAL factory and loads the expected view side by side.
const resolveForkPair = async (route, expectedSpec) => {
  const [resolved, expected] = await Promise.all([
    route.component(),
    loadExpectedView(expectedSpec)
  ])
  return { resolved: resolved.default, expected: expected.default }
}

export const describeRouteForkContract = ({ resource, routeFile, forks }) => {
  describe(`route fork — ${resource}`, () => {
    installFlagReset()

    for (const fork of forks) {
      it(`${fork.routeName}: flag ON loads the v6 view (${fork.v6View})`, async () => {
        flagOn()
        const route = findRoute(routeFile, fork.routeName)

        const { resolved, expected } = await resolveForkPair(route, fork.v6View)

        // Module identity: the factory imported exactly this view file.
        expect(resolved, `route "${fork.routeName}" must resolve ${fork.v6View}`).toBe(expected)
      })

      it(`${fork.routeName}: flag OFF loads the legacy view (${fork.legacyView})`, async () => {
        flagOff()
        const route = findRoute(routeFile, fork.routeName)

        const { resolved, expected } = await resolveForkPair(route, fork.legacyView)

        expect(resolved, `route "${fork.routeName}" must resolve ${fork.legacyView}`).toBe(expected)
      })
    }
  })
}
