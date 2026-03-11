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
   * Structure (DeployTemplateCard style):
   * - Header: title
   * - Content: Preview (image/thumbnail) + Info Block
   * - Description Section: Git configuration text
   * - Inputs Section: grid of up to 2 columns (via slot)
   * - Footer: Next button (full width)
   *
   * Slots:
   * - #header: Custom header content (optional)
   * - #preview: Preview image or custom preview (e.g., iframe)
   * - #info: Template info block (title, description, links)
   * - #github-connection: Area for GitHub/VCS integration UI
   * - #inputs: Form inputs rendered in grid (max 2 cols)
   * - #footer-actions: Custom footer actions (optional)
   */
  import { ref, computed, onBeforeUnmount } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import PrimeButton from 'primevue/button'

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

    // Footer action
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
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['next'])

  // ============================================================================
  // Common State
  // ============================================================================
  const toast = useToast()

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
   * Check if preview image should be shown
   */
  // const hasPreview = computed(() => !!props.previewSrc)

  /**
   * Check if GitHub link should be shown
   */
  // const hasGithubLink = computed(() => !!props.githubUrl)

  /**
   * Check if template icon should be shown
   */
  // const hasTemplateIcon = computed(() => !!props.templateIcon)

  /**
   * Check if template info block should be shown
   */
  // const hasTemplateInfo = computed(() => !!props.templateTitle)

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

  /**
   * Handles the Next button click
   */
  const handleNext = () => {
    emit('next')
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
    // Template Info
    // hasTemplateIcon
  })
</script>

<template>
  <div class="flex flex-col max-w-2xl min-h-[400px] border surface-border rounded-md">
    <div class="h-14 px-6 border-b surface-border flex items-center">
      <slot name="header">
        <div class="flex-1 text-color text-xl font-semibold leading-5">
          {{ props.title || 'Start from Template' }}
        </div>
      </slot>
    </div>

    <div class="p-6 bg-[var(—surface-50)] flex flex-col gap-6 flex-1">
      <div
        class="bg-[var(—surface-50)]rounded-lg border surface-border flex flex-col md:flex-row gap-5 overflow-hidden"
      >
        <div class="w-full md:w-72 shrink-0 flex flex-col justify-center items-center">
          <slot name="preview">
            <div
              class="w-full h-48 bg-surface-section rounded-lg flex flex-col justify-center items-center overflow-hidden"
            >
              <img
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
            :templateTitle="props.templateTitle"
            :templateUrl="props.templateUrl"
            :templateIcon="props.templateIcon"
            :templateDescription="props.templateDescription"
            :githubUrl="props.githubUrl"
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
                      <i class="pi pi-external-link text-[10px] text-color-secondary"></i>
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
                <i class="pi pi-github text-color-secondary text-[14px]"></i>
                <span class="text-[10px] text-color-secondary leading-3 line-clamp-3">
                  {{ props.githubUrl }}
                </span>
              </div>
            </div>
          </slot>
        </div>
      </div>

      <div class="text-xs text-color-secondary leading-4">
        {{ gitDescription }}
      </div>

      <slot
        name="github-connection"
        :hasIntegrationsList="hasIntegrationsList"
        :listOfIntegrations="listOfIntegrations"
        :isIntegrationsLoading="isIntegrationsLoading"
        :oauthGithubRef="oauthGithubRef"
        :triggerConnectWithGithub="triggerConnectWithGithub"
        :setCallbackUrl="setCallbackUrl"
        :vcsIntegrationFieldName="vcsIntegrationFieldName"
      />

      <div
        v-if="$slots.inputs"
        class="flex flex-col gap-4"
      >
        <slot
          name="inputs"
          :schema="props.schema"
          :isDrawer="props.isDrawer"
          :formData="formData"
          :formErrors="formErrors"
        />
      </div>

      <slot
        name="form-content"
        :schema="props.schema"
        :isDrawer="props.isDrawer"
        :formData="formData"
        :formErrors="formErrors"
      />
    </div>

    <div
      v-if="props.showNextButton || $slots['footer-actions']"
      class="h-14 px-6 border-t surface-border flex flex-col justify-center"
    >
      <slot name="footer-actions">
        <PrimeButton
          class="w-full flex-row-reverse"
          :label="props.nextLabel"
          :loading="props.loading"
          :disabled="props.disabled"
          severity="primary"
          @click="handleNext"
        />
      </slot>
    </div>
  </div>
</template>
