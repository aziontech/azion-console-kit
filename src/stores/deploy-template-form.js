import { defineStore } from 'pinia'

/**
 * Store for persisting deploy template form data across navigation steps.
 * Used to maintain form state when navigating between repository, settings, deploying, and success steps.
 */
export const useDeployTemplateFormStore = defineStore('deployTemplateForm', {
  state: () => ({
    // Current step: 'repository', 'settings', 'deploying', 'success'
    currentStep: 'repository',

    // Form data from repository step
    formData: {},

    // Selected VCS integration
    selectedIntegration: '',

    // Callback URL for GitHub OAuth
    callbackUrl: '',

    // List of VCS integrations (cached)
    listOfIntegrations: [],

    // Deploy related data
    executionId: '',
    applicationName: '',
    deployStartTime: null,
    appUrl: '',
    results: null,
    deployFailed: false
  }),

  getters: {
    getCurrentStep: (state) => state.currentStep,
    getFormData: (state) => state.formData,
    getSelectedIntegration: (state) => state.selectedIntegration,
    getCallbackUrl: (state) => state.callbackUrl,
    getListOfIntegrations: (state) => state.listOfIntegrations,
    getExecutionId: (state) => state.executionId,
    getApplicationName: (state) => state.applicationName,
    getDeployStartTime: (state) => state.deployStartTime,
    getAppUrl: (state) => state.appUrl,
    getResults: (state) => state.results,
    getDeployFailed: (state) => state.deployFailed
  },

  actions: {
    // Step management
    setCurrentStep(step) {
      this.currentStep = step
    },

    // Form data management
    setFormData(data) {
      this.formData = { ...data }
    },

    updateFormData(key, value) {
      this.formData[key] = value
    },

    clearFormData() {
      this.formData = {}
    },

    // VCS integration management
    setSelectedIntegration(integrationId) {
      this.selectedIntegration = integrationId
    },

    setCallbackUrl(url) {
      this.callbackUrl = url
    },

    setListOfIntegrations(integrations) {
      this.listOfIntegrations = [...integrations]
    },

    // Deploy state management
    setExecutionId(id) {
      this.executionId = id
    },

    setApplicationName(name) {
      this.applicationName = name
    },

    setDeployStartTime(time) {
      this.deployStartTime = time
    },

    setAppUrl(url) {
      this.appUrl = url
    },

    setResults(results) {
      this.results = results ? { ...results } : null
    },

    setDeployFailed(failed) {
      this.deployFailed = failed
    },

    // Reset all state
    reset() {
      this.currentStep = 'repository'
      this.formData = {}
      this.selectedIntegration = ''
      this.callbackUrl = ''
      this.listOfIntegrations = []
      this.executionId = ''
      this.applicationName = ''
      this.deployStartTime = null
      this.appUrl = ''
      this.results = null
      this.deployFailed = false
    },

    // Reset only deploy-related state (keep form data)
    resetDeployState() {
      this.executionId = ''
      this.applicationName = ''
      this.deployStartTime = null
      this.appUrl = ''
      this.results = null
      this.deployFailed = false
    }
  },

  persist: true
})
