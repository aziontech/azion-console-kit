<script setup>
  import { ref, computed, onBeforeUnmount } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from './BaseDeployCard.vue'
  import TemplateInfoBlock from './TemplateInfoBlock.vue'

  const props = defineProps({
    // Preview block
    imagePreview: {
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

  const emit = defineEmits(['next'])

  const toast = useToast()
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')

  // Form State
  const formData = ref({})
  const formErrors = ref([])

  const hasIntegrationsList = computed(() => {
    return listOfIntegrations.value?.length > 0
  })

  const gitDescription = `Configure your Git repository to integrate your codebase and automate deployments directly from your version control system.`

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

  onBeforeUnmount(() => {
    removeEventListenerToGithubIntegration()
  })

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
      <TemplateInfoBlock
        :preview-src="props.imagePreview"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
      >
        <template #preview="slotProps">
          <slot
            name="preview"
            v-bind="slotProps"
          />
        </template>

        <template #info="slotProps">
          <slot
            name="info"
            v-bind="slotProps"
          />
        </template>
      </TemplateInfoBlock>

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
