<script setup>
  import { ref, computed, onBeforeUnmount, watch, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import { getScriptRunnerLogsService } from '@/services/script-runner-service'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from '../deploy-template/BaseDeployCard.vue'
  import TemplateSettingsCard from '../deploy-template/TemplateSettingsCard.vue'
  import DeployStatusCard from '../deploy-template/DeployStatusCard.vue'
  import DeploySuccessCard from '../deploy-template/DeploySuccessCard.vue'

  const router = useRouter()

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

  const emit = defineEmits([
    'next',
    'deploy',
    'finish',
    'retry',
    'manage',
    'open-url',
    'next-step',
    'save-domains'
  ])

  const toast = useToast()

  // Step Navigation State
  const currentStep = ref('repository')
  const isTransitioning = ref(false)
  const isSavingDomains = ref(false)
  const step2Ref = ref(null)
  const step3Ref = ref(null)
  const step4Ref = ref(null)
  const showNextButton = ref(props.showNextButton)
  const simulationTimerRef = ref(null)
  // Track when deploy is initiated but waiting for executionId
  const isDeployInitiated = ref(false)

  // VCS Integration State
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')

  // Form State (to be managed by consumer components)
  const formData = ref({})
  const formErrors = ref([])

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
    if (event.origin !== window.location.origin) return

    if (event.data.event === 'integration-data') {
      await saveIntegration(event.data)
    } else if (event.data.event === 'integration-connected') {
      await listIntegrations()
    } else if (event.data.event === 'integration-error') {
      const errorMessage =
        event.data.data?.error_description || event.data.data?.error || 'Unknown error'
      toast.add({
        closable: true,
        severity: 'error',
        summary: `GitHub integration failed: ${errorMessage}`
      })
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
        summary: `GitHub integration failed: ${err.message}`,
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

  const openPreviewTempalte = () => {
    if (props.templateUrl) {
      window.open(props.templateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const openGitHub = () => {
    if (props.githubUrl) {
      window.open(props.githubUrl, '_blank', 'noopener,noreferrer')
    }
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
   * Scrolls to settings card after it appears
   */
  const goToSettings = async () => {
    const isValid = await validateBeforeProceed()
    if (!isValid) return

    currentStep.value = 'settings'
    emit('next')
    // Scroll to settings card after it appears
    nextTick(() => {
      scrollToElement(step2Ref)
    })
  }

  /**
   * Navigate to deployment step (step 3)
   * Called when executionId arrives
   */
  const goToDeployment = () => {
    currentStep.value = 'deployment'
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
   * Handle deploy action - validates and initiates deploy
   * Card stays visible with disabled fields and loading button until executionId arrives
   */
  const handleDeploy = async () => {
    const isValid = await validateBeforeProceed()
    if (!isValid) return

    isDeployInitiated.value = true
    emit('deploy')
  }

  /**
   * Scroll to a step element with smooth animation
   * @param {Object} elementRef - Vue ref to the element
   */
  const scrollToElement = (elementRef) => {
    const element = elementRef?.value?.$el || elementRef?.value
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  /**
   * Navigate to success step (step 4)
   * Called after deploy finishes successfully
   * Scroll to top of page to show success card
   */
  const goToSuccess = () => {
    currentStep.value = 'success'
    // Scroll to top for success card
    setTimeout(() => {
      window.scrollTo({ behavior: 'smooth', top: 0 })
    }, 100)
  }

  /**
   * Handle deploy finish
   * Called when DeployStatusCard emits 'finish' (deploy completed)
   * Only emits finish - parent will fetch results and pass them back
   */
  const handleFinish = () => {
    emit('finish')
  }

  /**
   * Handle retry action
   */
  const handleRetry = () => {
    // Go back to settings if has settings, otherwise go to repository
    currentStep.value = props.hasSettings ? 'settings' : 'repository'
    isDeployInitiated.value = false
    showNextButton.value = props.showNextButton
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
   * Handle save domains action
   * Called when user saves domain settings from DeploySuccessCard
   * Emits event and sets loading state - parent component must call handleSaveDomainsComplete when done
   */
  const handleSaveDomains = (values) => {
    isSavingDomains.value = true
    emit('save-domains', values)
  }

  /**
   * Complete the save domains operation - resets loading state
   * Called by parent component after save operation completes (success or error)
   */
  const handleSaveDomainsComplete = () => {
    isSavingDomains.value = false
  }

  /**
   * Reset flow to first step
   */
  const reset = () => {
    currentStep.value = 'repository'
    isTransitioning.value = false
    isDeployInitiated.value = false
    showNextButton.value = props.showNextButton
    clearDeploySimulation()
  }

  /**
   * Watch for results prop changes
   * When results are populated (from null to object), navigate to success step
   */
  watch(
    () => props.results,
    (newResults) => {
      if (newResults && currentStep.value === 'deployment') {
        goToSuccess()
      }
    }
  )

  /**
   * Watch for executionId to arrive
   * When it does, transition to deployment step and scroll to DeployStatusCard
   */
  watch(
    () => props.executionId,
    (newExecutionId) => {
      if (newExecutionId && isDeployInitiated.value) {
        currentStep.value = 'deployment'
        isDeployInitiated.value = false
        showNextButton.value = false
        // Scroll to DeployStatusCard after it becomes visible
        nextTick(() => {
          scrollToElement(step3Ref)
        })
      }
    }
  )

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
    goToSettings,
    goToDeployment,
    goToSuccess,
    handleSaveDomainsComplete
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
        :execution-id="props.executionId"
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
        :results="props.results"
        :next-steps="props.successNextSteps"
        :workload-id="props.results?.domain?.id"
        :is-saving="isSavingDomains"
        @on-save="handleSaveDomains"
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
      :hide-footer="currentStep !== 'repository' || isDeployInitiated"
    >
      <template #content>
        <div
          class="bg-[var(--surface-50)] h-40 rounded-lg border surface-border flex flex-col md:flex-row gap-5 overflow-hidden"
        >
          <div class="w-full md:w-72 shrink-0 flex flex-col justify-center items-center">
            <slot
              name="preview"
              :preview-src="props.previewSrc"
              :preview-alt="props.previewAlt"
            >
              <div
                class="w-full h-48 bg-surface-section l-rounded-lg flex flex-col justify-center items-center overflow-hidden"
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
                        class="text-sm font-semibold text-color transition-colors line-clamp-1"
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
                          @click="openPreviewTempalte"
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

              <div class="flex flex-col gap-1.5 mt-auto">
                <span class="text-[10px] text-color-secondary leading-3">Cloning from</span>
                <div class="flex items-center gap-1">
                  <i class="pi pi-github text-color-secondary text-[14px]" />
                  <span
                    class="text-[10px] text-color-secondary leading-3 line-clamp-3 cursor-pointer"
                    @click="openGitHub"
                  >
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
          v-if="currentStep === 'repository' && !isDeployInitiated"
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
          v-if="currentStep === 'repository' && !isDeployInitiated && $slots.inputs"
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
          v-if="currentStep === 'repository' && !isDeployInitiated"
          name="form-content"
          :schema="props.schema"
          :is-drawer="props.isDrawer"
          :form-data="formData"
          :form-errors="formErrors"
        />
      </template>

      <template
        v-if="
          currentStep === 'repository' &&
          !isDeployInitiated &&
          (showNextButton || $slots['footer-actions'])
        "
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
            :loading="props.loadingDeploy || isDeployInitiated"
            :disabled="props.disabledDeploy || isDeployInitiated"
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
      v-show="currentStep === 'settings' || currentStep === 'deployment'"
    >
      <TemplateSettingsCard
        :title="'Template Settings'"
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :github-url="props.githubUrl"
        :loading-deploy="props.loadingDeploy || isDeployInitiated"
        :disabled-deploy="props.disabledDeploy || props.loadingDeploy || isDeployInitiated"
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
      v-show="currentStep === 'deployment' || currentStep === 'success'"
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
        :deploy-started="currentStep === 'deployment' || currentStep === 'success'"
        @finish="handleFinish"
        @retry="handleRetry"
        @manage="handleManage"
        @open-url="handleOpenUrl"
        @next-step="handleNextStep"
      />
    </div>

    <div
      v-if="currentStep === 'repository'"
      class="mt-8 flex justify-center text-Global-textSecondaryColor text-xs font-semibold font-['Proto_Mono'] leading-5"
    >
      <span
        class="cursor-pointer flex justify-center px-3 py-1 rounded hover:surface-hover dark:hover:bg-gray-800 transition-colors duration-150 md:w-44 w-full"
        @click="navigateToMarkketplace"
      >
        Browse Templates →
      </span>
    </div>
  </div>
</template>
