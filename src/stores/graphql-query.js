import { defineStore } from 'pinia'

export const useGraphQLStore = defineStore({
  id: 'graphqlQuery',
  state: () => ({
    lastGraphQLQuery: {}
  }),
  getters: {
    getLastQuery: (state) => state.lastGraphQLQuery
  },
  actions: {
    setQuery(query) {
      this.lastGraphQLQuery = query
    }
  }
})
