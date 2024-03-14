import { defineStore } from 'pinia'

export const useSolutionStore = defineStore({
  id: 'solutionCreate',
  state: () => ({
    solution: null
  }),
  actions: {
    setSolution(solution) {
      this.solution = solution
    },
    removeSolution() {
      this.solution = null
    }
  }
})
