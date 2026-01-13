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
        if (item.dynamic && item.queryParam && item.baseLabel) {
          const paramValue = route.query[item.queryParam]

          if (paramValue && item.typeMapping && item.typeMapping[paramValue]) {
            const mappedValue = item.typeMapping[paramValue][item.baseLabel]
            
            if (mappedValue) {
              return {
                ...item,
                label: mappedValue
              }
            }
            
            const routeType = item.baseLabel.toLowerCase().includes('create') ? 'create' : 'edit'
            return {
              ...item,
              label: item.typeMapping[paramValue][routeType] || item.label || item.baseLabel
            }
          }

          return {
            ...item,
            label: item.label || (paramValue ? `${item.baseLabel} - ${paramValue}` : item.baseLabel)
          }
        }

        if (item.dynamic && item.routeParam && entityName) {
          return {
            ...item,
            label: entityName
          }
        }

        if (item.dynamic && item.routeParam) {
          const paramValue = route.params[item.routeParam]
          const isNumericId = paramValue && !isNaN(paramValue)
          return {
            ...item,
            label: isNumericId ? null : paramValue || item.label,
            isLoading: isNumericId
          }
        }

        return item
      })
    }
  }
})
