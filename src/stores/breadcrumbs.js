import { defineStore } from 'pinia'

export const useBreadcrumbs = defineStore({
  id: 'breadcrumbs',
  state: () => ({
    items: []
  }),
  actions: {
    update(items, route = null, entityName = null) {
      if (!route) {
        this.items = items
        return
      }

      this.items = items.map((item) => {
        // A crumb can declare a parameterized destination (`toRoute`) resolved
        // from the current route params — e.g. the application crumb linking
        // back to its versions list, which needs the `:id` from the route.
        const to =
          item.toRoute && route
            ? {
                name: item.toRoute.name,
                params: (item.toRoute.params || []).reduce((acc, key) => {
                  if (route.params[key] !== undefined) acc[key] = route.params[key]
                  return acc
                }, {})
              }
            : item.to

        if (item.dynamic && item.queryParam && item.baseLabel) {
          const paramValue = route.query[item.queryParam]

          if (paramValue && item.typeMapping && item.typeMapping[paramValue]) {
            const mappedValue = item.typeMapping[paramValue][item.baseLabel]

            if (mappedValue) {
              return {
                ...item,
                to,
                label: mappedValue
              }
            }

            const routeType = item.baseLabel.toLowerCase().includes('create') ? 'create' : 'edit'
            return {
              ...item,
              to,
              label: item.typeMapping[paramValue][routeType] || item.label || item.baseLabel
            }
          }

          return {
            ...item,
            to,
            label: item.label || (paramValue ? `${item.baseLabel} - ${paramValue}` : item.baseLabel)
          }
        }

        // Opt-in: render the raw route param value (e.g. a version id) instead
        // of the loaded entity name. Checked before the entityName branch so
        // routes with more than one dynamic item (application + version) don't
        // collapse both into the same entity name.
        if (item.dynamic && item.routeParam && item.useParamValue) {
          const paramValue = route.params[item.routeParam]
          return {
            ...item,
            to,
            label: paramValue || item.label
          }
        }

        if (item.dynamic && item.routeParam && entityName) {
          return {
            ...item,
            to,
            label: entityName
          }
        }

        if (item.dynamic && item.routeParam) {
          const paramValue = route.params[item.routeParam]
          const isNumericId = paramValue && !isNaN(paramValue)
          return {
            ...item,
            to,
            label: isNumericId ? null : paramValue || item.label,
            isLoading: isNumericId
          }
        }

        return item
      })
    }
  }
})
