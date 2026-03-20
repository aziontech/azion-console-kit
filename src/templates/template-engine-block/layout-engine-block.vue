<script setup>
  import { ref, computed, onBeforeUnmount, nextTick, watch, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import { getScriptRunnerLogsService } from '@/services/script-runner-service'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from '../deploy-template/BaseDeployCard.vue'
  import TemplateSettingsCard from '../deploy-template/TemplateSettingsCard.vue'
  import DeployStatusCard from '../deploy-template/DeployStatusCard.vue'
  import DeploySuccessCard from '../deploy-template/DeploySuccessCard.vue'
  import { useDeployTemplateFormStore } from '@/stores/deploy-template-form'

  const router = useRouter()
  const route = useRoute()
  const deployTemplateFormStore = useDeployTemplateFormStore()

  const props = defineProps({
    title: {
      type: String,
      default: ''
    },
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },
    templateTitle: {
      type: String,
      default: ''
    },
    templateUrl: {
      type: String,
      default: ''
    },
    templateIcon: {
      type: String,
      default: ''
    },
    templateDescription: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    schema: {
      type: Object,
      default: () => ({})
    },
    /**
     * Groups to display in repository step (usually group[0])
     * Provided by parent component
     */
    repositoryGroups: {
      type: Array,
      default: () => []
    },
    /**
     * Groups to display in settings step (usually group[1+])
     * Provided by parent component
     */
    settingsGroups: {
      type: Array,
      default: () => []
    },
    isDrawer: {
      type: Boolean,
      default: false
    },
    nextLabel: {
      type: String,
      default: 'Next'
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showNextButton: {
      type: Boolean,
      default: true
    },
    deployLabel: {
      type: String,
      default: 'Deploy'
    },
    loadingDeploy: {
      type: Boolean,
      default: false
    },
    disabledDeploy: {
      type: Boolean,
      default: false
    },
    executionId: {
      type: String,
      default: ''
    },
    results: {
      type: Object,
      default: null
    },
    deployFailed: {
      type: Boolean,
      default: false
    },
    applicationName: {
      type: String,
      default: ''
    },
    deployStartTime: {
      type: Number,
      default: null
    },
    appUrl: {
      type: String,
      default: ''
    },
    successNextSteps: {
      type: Array,
      default: () => []
    },

    simulateDeploy: {
      type: [Boolean, Number],
      default: false
    },

    // Flow control
    /**
     * Whether the template has settings step
     * When true: footer shows "Next" button → scroll to settings
     * When false: footer shows "Deploy" button → emit deploy directly
     */
    hasSettings: {
      type: Boolean,
      default: false
    },
    /**
     * Validation function to call before proceeding
     * Should return a Promise<boolean> or boolean
     */
    onValidate: {
      type: Function,
      default: null
    }
  })

  const emit = defineEmits(['next', 'deploy', 'finish', 'retry', 'manage', 'open-url', 'next-step'])

  const toast = useToast()

  // Step Navigation State - synced with store and URL
  const currentStep = computed({
    get: () => deployTemplateFormStore.getCurrentStep,
    set: (value) => deployTemplateFormStore.setCurrentStep(value)
  })

  const isTransitioning = ref(false)
  const step2Ref = ref(null)
  const step3Ref = ref(null)
  const step4Ref = ref(null)
  const showNextButton = ref(props.showNextButton)
  const simulationTimerRef = ref(null)

  // VCS Integration State - synced with store
  const callbackUrl = computed({
    get: () => deployTemplateFormStore.getCallbackUrl,
    set: (value) => deployTemplateFormStore.setCallbackUrl(value)
  })

  const listOfIntegrations = computed({
    get: () => deployTemplateFormStore.getListOfIntegrations,
    set: (value) => deployTemplateFormStore.setListOfIntegrations(value)
  })

  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')

  // Form State - synced with store
  const formData = computed({
    get: () => deployTemplateFormStore.getFormData,
    set: (value) => deployTemplateFormStore.setFormData(value)
  })

  const formErrors = ref([])

  /**
   * Get current step from URL path parameter
   * @returns {string} The current step from URL or 'repository' as default
   */
  const getStepFromRoute = () => {
    const step = route.params.step
    if (step && ['repository', 'settings', 'deploying', 'success'].includes(step)) {
      return step
    }
    return 'repository'
  }

  /**
   * Get executionId from URL path parameter
   * @returns {string} The executionId from URL or empty string
   */
  const getExecutionIdFromRoute = () => {
    return route.params.executionId || ''
  }

  /**
   * Update URL with current step as path segment
   * @param {string} step - The step to set in URL path
   * @param {string} [executionId] - Optional executionId to include in URL (for deploying/success steps)
   */
  const updateRouteStep = (step, executionId = null) => {
    const currentPath = route.path
    const pathSegments = currentPath.split('/').filter(Boolean)

    // Remove the last segments if they're valid step/executionId
    const validSteps = ['repository', 'settings', 'deploying', 'success']
    // Remove executionId if present (it comes after step)
    if (validSteps.includes(pathSegments[pathSegments.length - 2])) {
      pathSegments.pop()
    }
    // Remove step if present
    if (validSteps.includes(pathSegments[pathSegments.length - 1])) {
      pathSegments.pop()
    }

    // Add the new step (always use 'repository' as default, but don't add it to URL)
    if (step !== 'repository') {
      pathSegments.push(step)
      // Add executionId for deploying or success step if provided
      if ((step === 'deploying' || step === 'success') && executionId) {
        pathSegments.push(executionId)
      }
    }

    const newPath = '/' + pathSegments.join('/')
    router.push(newPath)
  }

  // Initialize step from route on mount
  onMounted(() => {
    const routeStep = getStepFromRoute()
    if (routeStep !== currentStep.value) {
      deployTemplateFormStore.setCurrentStep(routeStep)
    }
  })

  // Watch for route changes to sync step
  watch(
    () => route.params.step,
    (newStep) => {
      const step = newStep || 'repository'
      if (['repository', 'settings', 'deploying', 'success'].includes(step)) {
        if (step !== currentStep.value) {
          deployTemplateFormStore.setCurrentStep(step)
        }
      }
    }
  )

  // Watch for executionId changes to update the route
  watch(
    () => props.executionId,
    (newExecutionId) => {
      // Only update route if we have executionId and we're in deploying or success step
      if (newExecutionId && ['deploying', 'success'].includes(currentStep.value)) {
        updateRouteStep(currentStep.value, newExecutionId)
      }
    }
  )

  /**
   * Check if there are VCS integrations available
   * Used by both implementations to toggle UI states
   */
  const hasIntegrationsList = computed(() => {
    return listOfIntegrations.value?.length > 0
  })
  /**
   * Triggers the GitHub OAuth flow
   * Called when user clicks "Connect with GitHub" or "Add GitHub Account"
   */
  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      const ref = Array.isArray(oauthGithubRef.value)
        ? oauthGithubRef.value[0]
        : oauthGithubRef.value
      ref?.connectWithGithub?.()
    }
  }

  /**
   * Fetches the list of available VCS integrations
   * Updates listOfIntegrations and sets the default integration
   * @returns {Promise<void>}
   */
  const listIntegrations = async () => {
    try {
      isIntegrationsLoading.value = true
      const data = await vcsService.listIntegrations()
      listOfIntegrations.value = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    } finally {
      isIntegrationsLoading.value = false
    }
  }

  /**
   * Handles postMessage events from GitHub OAuth popup
   * @param {MessageEvent} event - The message event from the OAuth window
   */
  const handleGithubIntegrationMessage = async (event) => {
    if (event.data.event === 'integration-data') {
      await saveIntegration(event.data)
    }
  }

  /**
   * Adds event listener for GitHub integration postMessage
   */
  const addEventListenerToGithubIntegration = () => {
    window.addEventListener('message', handleGithubIntegrationMessage)
  }

  /**
   * Removes event listener for GitHub integration postMessage
   */
  const removeEventListenerToGithubIntegration = () => {
    window.removeEventListener('message', handleGithubIntegrationMessage)
  }

  /**
   * Saves the GitHub integration after OAuth callback
   * @param {Object} integration - The integration data from OAuth
   */
  const saveIntegration = async (integration) => {
    isIntegrationsLoading.value = true
    try {
      await vcsService.postCallbackUrl(callbackUrl.value, integration.data)
    } catch (error) {
      error.showWithOptions?.(toast, (err) => ({
        summary: `GitHub integration failed: ${err.detail}`,
        severity: 'error'
      }))
    } finally {
      await listIntegrations()
    }
  }

  /**
   * Sets the callback URL for GitHub OAuth
   * @param {string} uri - The callback URI
   */
  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }

  /**
   * Loads VCS integrations and sets up event listeners
   * Call this when the form needs to show GitHub integration options
   * @returns {Promise<void>}
   */
  const loadIntegrationOnShowButton = async () => {
    await listIntegrations()
    addEventListenerToGithubIntegration()
  }

  /**
   * Validate form before proceeding
   * @returns {Promise<boolean>} Whether the form is valid
   */
  const validateBeforeProceed = async () => {
    if (props.onValidate) {
      const isValid = await props.onValidate(currentStep.value)
      return isValid
    }
    return true
  }

  /**
   * Navigate to settings step (step 2)
   * Validates form first, then proceeds if valid
   */
  const goToSettings = async () => {
    const isValid = await validateBeforeProceed()
    if (!isValid) return

    deployTemplateFormStore.setCurrentStep('settings')
    updateRouteStep('settings')
    emit('next')

    nextTick(() => {
      step2Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    })
  }

  /**
   * Navigate to deploying step (step 3)
   * Called when user clicks Deploy on TemplateSettingsCard
   */
  const goToDeploying = () => {
    deployTemplateFormStore.setCurrentStep('deploying')
    updateRouteStep('deploying')
    showNextButton.value = false

    nextTick(() => {
      // Scroll to step 3
      step3Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  /**
   * Clear deploy simulation timer
   */
  const clearDeploySimulation = () => {
    if (simulationTimerRef.value) {
      clearTimeout(simulationTimerRef.value)
      simulationTimerRef.value = null
    }
  }

  /**
   * Handle deploy action - validates and navigates to deploying step
   */
  const handleDeploy = async () => {
    const isValid = await validateBeforeProceed()
    if (!isValid) return

    goToDeploying()
    emit('deploy')
  }

  /**
   * Navigate to success step (step 4)
   * Called after deploy finishes successfully
   */
  const goToSuccess = () => {
    deployTemplateFormStore.setCurrentStep('success')
    updateRouteStep('success', props.executionId)

    nextTick(() => {
      step4Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  /**
   * Handle deploy finish
   * Called when DeployStatusCard emits 'finish' (deploy completed)
   */
  const handleFinish = () => {
    goToSuccess()
    emit('finish')
  }

  /**
   * Handle retry action
   */
  const handleRetry = () => {
    deployTemplateFormStore.setCurrentStep('settings')
    updateRouteStep('settings')
    emit('retry')
  }

  /**
   * Handle manage action
   */
  const handleManage = (data) => {
    emit('manage', data)
  }

  const navigateToMarkketplace = () => {
    router.push('/marketplace')
  }

  /**
   * Handle open URL action
   */
  const handleOpenUrl = (url) => {
    emit('open-url', url)
  }

  /**
   * Handle next step action
   */
  const handleNextStep = (data) => {
    emit('next-step', data)
  }

  /**
   * Reset flow to first step
   */
  const reset = () => {
    deployTemplateFormStore.setCurrentStep('repository')
    updateRouteStep('repository')
    isTransitioning.value = false
    clearDeploySimulation()
  }

  /**
   * Go back to repository step
   * Used when navigating back from settings
   */
  const goToRepository = () => {
    deployTemplateFormStore.setCurrentStep('repository')
    updateRouteStep('repository')
  }

  onBeforeUnmount(() => {
    removeEventListenerToGithubIntegration()
    clearDeploySimulation()
  })

  defineExpose({
    // VCS Integration
    listIntegrations,
    loadIntegrationOnShowButton,
    triggerConnectWithGithub,
    setCallbackUrl,
    hasIntegrationsList,
    listOfIntegrations,
    isIntegrationsLoading,
    oauthGithubRef,
    vcsIntegrationFieldName,
    callbackUrl,
    // Form State
    formData,
    formErrors,
    // Toast
    toast,
    // Step Navigation
    currentStep,
    step2Ref,
    step3Ref,
    step4Ref,
    reset,
    goToRepository,
    goToSettings,
    goToDeploying,
    goToSuccess,
    getExecutionIdFromRoute,
    // Store
    deployTemplateFormStore
  })
</script>

<template>
  <div class="layout-engine-block flex flex-col gap-6 min-w-[672px]">
    <div
      ref="step4Ref"
      v-show="currentStep === 'success'"
    >
      <DeploySuccessCard
        :app-url="props.appUrl"
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
        :next-steps="props.successNextSteps"
      >
        <template #customize-domain>
          <slot name="customize-domain" />
        </template>
      </DeploySuccessCard>
    </div>

    <BaseDeployCard
      v-if="currentStep !== 'success'"
      :title="props.title || 'Start from Template'"
      :step-index="0"
      :hide-footer="currentStep === 'settings'"
    >
      <template #content>
        <div
          class="bg-[var(--surface-50)] rounded-lg border surface-border flex flex-col md:flex-row gap-5 overflow-hidden"
        >
          <div class="w-full md:w-72 shrink-0 flex flex-col justify-center items-center">
            <slot
              name="preview"
              :preview-src="props.previewSrc"
              :preview-alt="props.previewAlt"
            >
              <div
                class="w-full h-48 bg-surface-section rounded-lg flex flex-col justify-center items-center overflow-hidden"
              >
                <img
                  v-if="props.previewSrc"
                  :src="props.previewSrc"
                  :alt="props.previewAlt || props.templateTitle"
                  class="w-full h-40 object-cover"
                />
              </div>
            </slot>
          </div>

          <div class="flex-1 py-4 pr-4 flex flex-col gap-3">
            <slot
              name="info"
              :template-title="props.templateTitle"
              :template-url="props.templateUrl"
              :template-icon="props.templateIcon"
              :template-description="props.templateDescription"
              :github-url="props.githubUrl"
            >
              <div
                v-if="props.templateTitle"
                class="flex items-center gap-2.5"
              >
                <img
                  v-if="props.templateIcon"
                  class="w-7 h-7 rounded"
                  :src="props.templateIcon"
                  alt=""
                />
                <div class="flex-1 flex items-center gap-1.5">
                  <div class="flex-1 flex flex-col justify-center gap-1">
                    <div class="flex items-center gap-1.5">
                      <a
                        v-if="props.templateUrl"
                        :href="props.templateUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm font-semibold text-color hover:text-primary transition-colors line-clamp-1"
                      >
                        {{ props.templateTitle }}
                      </a>
                      <span
                        v-else
                        class="text-sm font-semibold text-color line-clamp-1"
                      >
                        {{ props.templateTitle }}
                      </span>
                      <div v-if="props.templateUrl">
                        <i
                          class="pi pi-external-link text-sm cursor-pointer text-color-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p class="text-xs text-color-secondary leading-4">
                {{ props.templateDescription }}
              </p>

              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] text-color-secondary leading-3">Cloning from</span>
                <div class="flex items-center gap-1">
                  <i class="pi pi-github text-color-secondary text-[14px]" />
                  <span class="text-[10px] text-color-secondary leading-3 line-clamp-3">
                    {{ props.githubUrl }}
                  </span>
                </div>
              </div>
            </slot>
          </div>
        </div>

        <div
          v-if="currentStep === 'repository'"
          class="text-xs text-color-secondary leading-4"
        ></div>

        <slot
          v-if="currentStep === 'repository'"
          name="github-connection"
          :has-integrations-list="hasIntegrationsList"
          :list-of-integrations="listOfIntegrations"
          :is-integrations-loading="isIntegrationsLoading"
          :oauth-github-ref="oauthGithubRef"
          :trigger-connect-with-github="triggerConnectWithGithub"
          :set-callback-url="setCallbackUrl"
          :vcs-integration-field-name="vcsIntegrationFieldName"
        />

        <div
          v-if="currentStep === 'repository' && $slots.inputs"
          class="flex flex-col gap-4"
        >
          <slot
            name="inputs"
            :schema="props.schema"
            :is-drawer="props.isDrawer"
            :form-data="formData"
            :form-errors="formErrors"
            :has-integrations-list="hasIntegrationsList"
            :list-of-integrations="listOfIntegrations"
            :is-integrations-loading="isIntegrationsLoading"
            :oauth-github-ref="oauthGithubRef"
            :trigger-connect-with-github="triggerConnectWithGithub"
            :set-callback-url="setCallbackUrl"
            :vcs-integration-field-name="vcsIntegrationFieldName"
          />
        </div>

        <slot
          v-if="currentStep === 'repository'"
          name="form-content"
          :schema="props.schema"
          :is-drawer="props.isDrawer"
          :form-data="formData"
          :form-errors="formErrors"
        />
      </template>

      <template
        v-if="showNextButton || $slots['footer-actions']"
        #footer
      >
        <slot name="footer-actions">
          <!-- Next button: shown when hasSettings is true -->
          <PrimeButton
            v-if="props.hasSettings"
            class="w-full flex-row-reverse"
            :label="props.nextLabel"
            :loading="props.loading"
            :disabled="props.disabled"
            severity="primary"
            @click="goToSettings"
          />
          <!-- Deploy button: shown when hasSettings is false -->
          <PrimeButton
            v-else
            class="w-full flex-row-reverse"
            :label="props.deployLabel"
            :loading="props.loadingDeploy"
            :disabled="props.disabledDeploy"
            severity="primary"
            @click="handleDeploy"
          />
        </slot>
      </template>
    </BaseDeployCard>

    <!-- Only render TemplateSettingsCard when hasSettings is true -->
    <div
      v-if="props.hasSettings"
      ref="step2Ref"
      v-show="currentStep === 'settings' || currentStep === 'deploying'"
    >
      <TemplateSettingsCard
        :title="'Template Settings'"
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :github-url="props.githubUrl"
        :loading-deploy="props.loadingDeploy"
        :disabled-deploy="props.disabledDeploy || props.loadingDeploy"
        :deploy-label="props.deployLabel"
        :hide-footer="!!props.executionId"
        @deploy="handleDeploy"
      >
        <template #form>
          <slot
            name="settings-inputs"
            :schema="props.schema"
            :is-drawer="props.isDrawer"
            :form-data="formData"
            :form-errors="formErrors"
            :settings-groups="props.settingsGroups"
          />
          <slot name="settings-content" />
        </template>
      </TemplateSettingsCard>
    </div>

    <div
      ref="step3Ref"
      v-show="currentStep === 'deploying' || currentStep === 'success'"
    >
      <DeployStatusCard
        v-if="props.executionId"
        :execution-id="props.executionId"
        :get-logs-service="getScriptRunnerLogsService"
        :results="currentStep === 'success' ? { domain: { url: props.appUrl } } : props.results"
        :deploy-failed="props.deployFailed"
        :application-name="props.applicationName"
        :deploy-start-time="props.deployStartTime"
        :next-steps="props.nextSteps"
        :deploy-started="currentStep === 'deploying' || currentStep === 'success'"
        @finish="handleFinish"
        @retry="handleRetry"
        @manage="handleManage"
        @open-url="handleOpenUrl"
        @next-step="handleNextStep"
      />
    </div>

    <div
      v-if="currentStep === 'repository'"
      class="mt-8 justify-start text-Global-textSecondaryColor text-xs font-semibold font-['Proto_Mono'] leading-5"
    >
      <span
        class="cursor-pointer flex justify-center px-3 py-1 rounded hover:surface-hover dark:hover:bg-gray-800 transition-colors duration-150 w-auto"
        @click="navigateToMarkketplace"
      >
        Browse Templates →
      </span>
    </div>
  </div>
</template>
