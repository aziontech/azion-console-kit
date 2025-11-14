import { defineStore } from 'pinia'

export const useBreadcrumbs = defineStore({
  id: 'breadcrumbs',
  state: () => ({
    items: []
  }),
  actions: {
    update(items, route = null) {
      if (!route) {
        this.items = items
        return
      }

      this.items = items.map((item) => {
        if (item.dynamic && item.queryParam && item.baseLabel) {
          const paramValue = route.query[item.queryParam]

          if (paramValue && item.typeMapping && item.typeMapping[paramValue]) {
            const routeType = item.baseLabel.toLowerCase().includes('create') ? 'create' : 'edit'
            return {
              ...item,
              label: item.typeMapping[paramValue][routeType]
            }
          }

          return {
            ...item,
            label: paramValue ? `${item.baseLabel} - ${paramValue}` : item.baseLabel
          }
        }

        if (item.dynamic && item.routeParam) {
          const paramValue = route.params[item.routeParam]
          const processedTo = item.to ? item.to.replace(`:${item.routeParam}`, paramValue) : item.to
          return {
            ...item,
            label: paramValue || item.label,
            to: processedTo
          }
        }

        return item
      })
    }
  }
})
