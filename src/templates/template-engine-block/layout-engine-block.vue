<script setup>
  /**
   * layout-engine-block.vue
   *
   * Base layout component for template engine blocks.
   * Provides common props, state, functions, and slots for form rendering engines.
   *
   * This component centralizes shared functionality between engine-azion.vue and
   * engine-jsonform.vue, including VCS integration handling and common lifecycle hooks.
   *
   * Uses BaseDeployCard for layout structure.
   *
   * Slots:
   * - #preview: Preview image or custom preview (e.g., iframe)
   * - #info: Template info block (title, description, links)
   * - #github-connection: Area for GitHub/VCS integration UI
   * - #inputs: Form inputs rendered in grid (max 2 cols)
   * - #form-content: Additional form content
   * - #footer-actions: Custom footer actions (optional)
   */
  import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from '../deploy-template/BaseDeployCard.vue'
  import TemplateSettingsCard from '../deploy-template/TemplateSettingsCard.vue'
  import DeployStatusCard from '../deploy-template/DeployStatusCard.vue'
  import DeploySuccessCard from '../deploy-template/DeploySuccessCard.vue'

  // ============================================================================
  // Props - Common props shared between all engine implementations
  // ============================================================================
  const props = defineProps({
    // Header
    /**
     * Title displayed in the card header
     */
    title: {
      type: String,
      default: ''
    },

    // Preview block
    /**
     * URL of the template preview image
     */
    previewSrc: {
      type: String,
      default: ''
    },
    /**
     * Alt text for the preview image
     */
    previewAlt: {
      type: String,
      default: ''
    },

    // Info block
    /**
     * Title of the template (displayed as a link)
     */
    templateTitle: {
      type: String,
      default: ''
    },
    /**
     * External URL for the template title link (opens in new tab)
     */
    templateUrl: {
      type: String,
      default: ''
    },
    /**
     * URL of the template icon/image (displayed next to title)
     */
    templateIcon: {
      type: String,
      default: ''
    },
    /**
     * Description text for the template
     */
    templateDescription: {
      type: String,
      default: ''
    },
    /**
     * URL of the GitHub repository (displayed as "Cloning from" source)
     */
    githubUrl: {
      type: String,
      default: ''
    },

    // Form props
    /**
     * Schema object for the form
     * Structure varies by engine type (Azion format vs JSON Schema)
     */
    schema: {
      type: Object,
      default: () => ({})
    },
    /**
     * Whether the form is rendered inside a drawer component
     * Affects layout and styling
     */
    isDrawer: {
      type: Boolean,
      default: false
    },

    // Footer action - Step 1 (Next button)
    /**
     * Label for the Next button
     */
    nextLabel: {
      type: String,
      default: 'Next'
    },
    /**
     * Loading state for the Next button
     */
    loading: {
      type: Boolean,
      default: false
    },
    /**
     * Disabled state for the Next button
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Whether to show the Next button
     */
    showNextButton: {
      type: Boolean,
      default: true
    },

    // Footer action - Step 2 (Deploy button)
    /**
     * Label for the Deploy button
     */
    deployLabel: {
      type: String,
      default: 'Deploy'
    },
    /**
     * Loading state for the Deploy button
     */
    loadingDeploy: {
      type: Boolean,
      default: false
    },
    /**
     * Disabled state for the Deploy button
     */
    disabledDeploy: {
      type: Boolean,
      default: false
    },

    // Deploy Status Card props (Step 3)
    /**
     * Execution ID for the script runner
     */
    executionId: {
      type: String,
      default: ''
    },
    /**
     * Service function to get deploy logs
     */
    getLogsService: {
      type: Function,
      default: null
    },
    /**
     * Results from deploy (populated after finish)
     */
    results: {
      type: Object,
      default: null
    },
    /**
     * Deploy failed state
     */
    deployFailed: {
      type: Boolean,
      default: false
    },
    /**
     * Application name for heading
     */
    applicationName: {
      type: String,
      default: ''
    },
    /**
     * Deploy start time (timestamp)
     */
    deployStartTime: {
      type: Number,
      default: null
    },
    /**
     * Next steps configuration
     */
    nextSteps: {
      type: Array,
      default: () => [
        {
          title: 'Customize Domain',
          description: 'Associate a custom domain and subdomains to Azion to handle user access.',
          handle: () => {}
        },
        {
          title: 'Point Traffic',
          description:
            'Redirect the traffic of a domain to Azion and take advantage of the distributed network.',
          handle: () => {}
        },
        {
          title: 'View Analytics',
          description: 'Gain powerful insights into your performance, availability, and security.',
          handle: () => {}
        }
      ]
    },

    // Deploy Success Card props (Step 4)
    /**
     * Application URL displayed after successful deploy
     */
    appUrl: {
      type: String,
      default: ''
    },
    /**
     * Next steps configuration for success card
     */
    successNextSteps: {
      type: Array,
      default: () => []
    },

    // Simulation mode
    /**
     * Simulates deploy success after specified milliseconds
     * Set to true for default 5 seconds, or pass a number for custom delay
     */
    simulateDeploy: {
      type: [Boolean, Number],
      default: false
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['next', 'deploy', 'finish', 'retry', 'manage', 'open-url', 'next-step'])

  // ============================================================================
  // Common State
  // ============================================================================
  const toast = useToast()

  // Step Navigation State
  const currentStep = ref('success')
  const isTransitioning = ref(false)
  const step2Ref = ref(null)
  const step3Ref = ref(null)
  const step4Ref = ref(null)
  const showNextButton = ref(props.showNextButton)
  const simulationTimerRef = ref(null)

  // VCS Integration State
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')

  // Form State (to be managed by consumer components)
  const formData = ref({})
  const formErrors = ref([])

  // ============================================================================
  // Common Computed
  // ============================================================================
  /**
   * Check if there are VCS integrations available
   * Used by both implementations to toggle UI states
   */
  const hasIntegrationsList = computed(() => {
    return listOfIntegrations.value?.length > 0
  })

  /**
   * Fixed description text for Git configuration section
   */
  const gitDescription = `Configure your Git repository to integrate your codebase and automate deployments directly from your version control system.`

  // ============================================================================
  // VCS Integration Functions
  // ============================================================================

  /**
   * Triggers the GitHub OAuth flow
   * Called when user clicks "Connect with GitHub" or "Add GitHub Account"
   */
  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      // Handle both single ref and array ref scenarios
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

  // ============================================================================
  // Step Navigation Methods
  // ============================================================================
  /**
   * Navigate to settings step (step 2)
   * Smooth scrolls to step 2, keeping step 1 visible
   */
  const goToSettings = () => {
    currentStep.value = 'settings'
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
    currentStep.value = 'deploying'
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
   * Handle deploy action from settings step
   */
  const handleDeploy = () => {
    goToDeploying()
    emit('deploy')
  }

  /**
   * Navigate to success step (step 4)
   * Called after deploy finishes successfully
   */
  const goToSuccess = () => {
    currentStep.value = 'success'

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
    currentStep.value = 'settings'
    emit('retry')
  }

  /**
   * Handle manage action
   */
  const handleManage = (data) => {
    emit('manage', data)
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
    currentStep.value = 'repository'
    isTransitioning.value = false
    clearDeploySimulation()
  }

  onBeforeUnmount(() => {
    removeEventListenerToGithubIntegration()
    clearDeploySimulation()
  })

  // ============================================================================
  // Expose - Methods and state that consumers might need access to
  // ============================================================================
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
    goToDeploying,
    goToSuccess
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
                      <div
                        v-if="props.templateUrl"
                        class="w-3 h-3 relative overflow-hidden"
                      >
                        <i class="pi pi-external-link text-[10px] text-color-secondary" />
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
        >
          {{ gitDescription }}
        </div>

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
          <PrimeButton
            class="w-full flex-row-reverse"
            :label="props.nextLabel"
            :loading="props.loading"
            :disabled="props.disabled"
            severity="primary"
            @click="goToSettings"
          />
        </slot>
      </template>
    </BaseDeployCard>

    <div
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
        :disabled="props.disabledDeploy"
        :deploy-label="props.deployLabel"
        :hide-footer="currentStep === 'deploying'"
        @deploy="handleDeploy"
      >
        <template #content>
          <slot name="settings-content" />
        </template>
      </TemplateSettingsCard>
    </div>

    <div
      ref="step3Ref"
      v-show="currentStep === 'deploying' || currentStep === 'success'"
    >
      <DeployStatusCard
        :execution-id="props.executionId"
        :get-logs-service="props.getLogsService"
        :results="currentStep === 'success' ? { domain: { url: props.appUrl } } : props.results"
        :deploy-failed="props.deployFailed"
        :application-name="props.applicationName"
        :deploy-start-time="props.deployStartTime"
        :next-steps="props.nextSteps"
        :deploy-started="currentStep === 'deploying'"
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
      <span class="cursor-pointer flex justify-center"> Browse Templates → </span>
    </div>
  </div>
</template>
