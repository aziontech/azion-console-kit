<script setup>
  /**
   * DeployRepositoryCard.vue
   *
   * Step 1 of the deploy template flow.
   * Displays template preview, info, and git configuration.
   *
   * Uses BaseDeployCard for layout structure.
   * Emits @next when user clicks the Next button.
   *
   * This component is stateless - all state lives in the orchestrator.
   */
  import { ref, computed, onBeforeUnmount } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from './BaseDeployCard.vue'

  // ============================================================================
  // Props
  // ============================================================================
  const props = defineProps({
    // Preview block
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },

    // Info block
    templateTitle: {
      type: String,
      required: true
    },
    templateUrl: {
      type: String,
      required: true
    },
    templateDescription: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },

    // Form props
    schema: {
      type: Object,
      default: () => ({})
    },
    isDrawer: {
      type: Boolean,
      default: false
    },

    // Footer action
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

    // Collapsed state - when true, only show title and preview
    collapsed: {
      type: Boolean,
      default: false
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['next'])

  // ============================================================================
  // VCS Integration State
  // ============================================================================
  const toast = useToast()
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')

  // Form State
  const formData = ref({})
  const formErrors = ref([])

  // ============================================================================
  // Computed
  // ============================================================================
  const hasIntegrationsList = computed(() => {
    return listOfIntegrations.value?.length > 0
  })

  const gitDescription = `Configure your Git repository to integrate your codebase and automate deployments directly from your version control system.`

  // ============================================================================
  // VCS Integration Functions
  // ============================================================================
  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      const ref = Array.isArray(oauthGithubRef.value)
        ? oauthGithubRef.value[0]
        : oauthGithubRef.value
      ref?.connectWithGithub?.()
    }
  }

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

  const handleGithubIntegrationMessage = async (event) => {
    if (event.data.event === 'integration-data') {
      await saveIntegration(event.data)
    }
  }

  const addEventListenerToGithubIntegration = () => {
    window.addEventListener('message', handleGithubIntegrationMessage)
  }

  const removeEventListenerToGithubIntegration = () => {
    window.removeEventListener('message', handleGithubIntegrationMessage)
  }

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

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }

  const loadIntegrationOnShowButton = async () => {
    await listIntegrations()
    addEventListenerToGithubIntegration()
  }

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
  // Expose
  // ============================================================================
  defineExpose({
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
    formData,
    formErrors,
    toast
  })
</script>

<template>
  <BaseDeployCard
    title="Start from Template"
    :hide-footer="props.collapsed"
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
            :template-description="props.templateDescription"
            :github-url="props.githubUrl"
          >
            <div
              v-if="props.templateTitle"
              class="flex items-center gap-2.5"
            >
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

            <p
              v-if="props.templateDescription"
              class="text-xs text-color-secondary leading-4"
            >
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
        v-if="!props.collapsed"
        class="text-xs text-color-secondary leading-4"
      >
        {{ gitDescription }}
      </div>

      <slot
        v-if="!props.collapsed"
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
        v-if="!props.collapsed && $slots.inputs"
        class="flex flex-col gap-4"
      >
        <slot
          name="inputs"
          :schema="props.schema"
          :is-drawer="props.isDrawer"
          :form-data="formData"
          :form-errors="formErrors"
        />
      </div>

      <slot
        v-if="!props.collapsed"
        name="form-content"
        :schema="props.schema"
        :is-drawer="props.isDrawer"
        :form-data="formData"
        :form-errors="formErrors"
      />
    </template>

    <template #footer>
      <slot
        name="footer-actions"
        v-if="!props.collapsed"
      >
        <PrimeButton
          type="button"
          class="w-full flex-row-reverse"
          :label="props.nextLabel"
          :loading="props.loading"
          :disabled="props.disabled"
          severity="primary"
          @click.stop="handleNext"
        />
      </slot>
    </template>
  </BaseDeployCard>
</template>
