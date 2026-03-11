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
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['next', 'deploy'])

  // ============================================================================
  // Common State
  // ============================================================================
  const toast = useToast()

  // Step Navigation State
  const currentStep = ref('repository')
  const isTransitioning = ref(false)
  const step2Ref = ref(null)

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
      // Scroll to step 2 but keep step 1 visible (center alignment)
      step2Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    })
  }

  /**
   * Handle deploy action from settings step
   */
  const handleDeploy = () => {
    emit('deploy')
  }

  /**
   * Reset flow to first step
   */
  const reset = () => {
    currentStep.value = 'repository'
    isTransitioning.value = false
  }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  onBeforeUnmount(() => {
    removeEventListenerToGithubIntegration()
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
    reset,
    goToSettings
  })
</script>

<template>
  <div class="layout-engine-block flex flex-col gap-6 min-w-[672px]">
    <BaseDeployCard
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
        v-if="props.showNextButton || $slots['footer-actions']"
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
      v-show="currentStep === 'settings'"
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
        @deploy="handleDeploy"
      >
        <template #content>
          <slot name="settings-content" />
        </template>
      </TemplateSettingsCard>
    </div>

    <div
      v-if="currentStep === 'repository'"
      class="mt-8 justify-start text-Global-textSecondaryColor text-xs font-semibold font-['Proto_Mono'] leading-5"
    >
      <span class="cursor-pointer flex justify-center"> Browse Templates → </span>
    </div>
  </div>
</template>
