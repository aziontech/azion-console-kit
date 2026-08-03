/**
 * Route helpers shared by the flag-v6 suites (route-fork contract and
 * legacy-smoke contract) — one glob, one traversal, no duplication.
 */

// Route definitions: eager (cheap — route files only import services/helpers).
export const routeModules = import.meta.glob('/src/router/routes/*/index.js', { eager: true })
// Views: LAZY — only the views referenced by descriptors get loaded.
export const viewModules = import.meta.glob('/src/views/**/*.vue')

export const flattenRoutes = (node) => [node, ...(node.children ?? []).flatMap(flattenRoutes)]

export const findRoute = (routeFile, routeName) => {
  const mod = routeModules[`/${routeFile}`]
  if (!mod) throw new Error(`route file not found by glob: ${routeFile}`)
  const roots = Object.values(mod).filter((value) => value && typeof value === 'object')
  const route = roots.flatMap(flattenRoutes).find((record) => record.name === routeName)
  if (!route) throw new Error(`route "${routeName}" not found in ${routeFile}`)
  return route
}

// '@views/X.vue' | '@/views/X.vue' → '/src/views/X.vue' (the glob key shape).
export const toViewKey = (spec) =>
  spec.replace(/^@views\//, '/src/views/').replace(/^@\/views\//, '/src/views/')

export const loadExpectedView = async (spec) => {
  const loader = viewModules[toViewKey(spec)]
  if (!loader) throw new Error(`inventory view does not exist on disk: ${spec}`)
  return loader()
}

/** Route props normalized the way vue-router does (object | fn(route) | none). */
export const resolveRouteProps = (record, routeLocation) => {
  if (typeof record.props === 'function') return record.props(routeLocation)
  if (record.props && typeof record.props === 'object') return record.props
  return {}
}
