import { defineStore } from 'pinia'

export const useSolutionCreate = defineStore({
  id: 'solutionCreate',
  state: () => ({
    solution: null
  }),
  persist: true,
  getters: {
    getSolution() {
      return this.solution
    }
  },
  actions: {
    addSolution(solution) {
      this.solution = solution
    },
    removeSolution() {
      this.solution = null
    }
  }
})
