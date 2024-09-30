import { defineStore } from 'pinia'

export const useTableDefinitionsStore = defineStore({
  id: 'tableDefinitions',
  state: () => ({
    numberOfLinesPerPage: 10
  }),
  persist: {
    paths: ['numberOfLinesPerPage']
  },
  getters: {
    getNumberOfLinesPerPage: (state) => state.numberOfLinesPerPage
  },
  actions: {
    setNumberOfLinesPerPage(numberOfLinesPerPage) {
      this.numberOfLinesPerPage = numberOfLinesPerPage
    }
  }
})
