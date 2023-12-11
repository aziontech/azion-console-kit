import { defineStore } from 'pinia'

export const useBreadcrumbs = defineStore({
  id: 'breadcrumbs',
  state: () => ({
    items: []
  }),
  actions: {
    update(items) {
      this.items = items
    }
  }
})
