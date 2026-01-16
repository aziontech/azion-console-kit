<script setup>
  import { computed, ref, markRaw, watch, onMounted, onBeforeUnmount } from 'vue'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import Dropdown from 'primevue/dropdown'
  import { useToast } from 'primevue/usetoast'
  import LabelBlock from '@/templates/label-block'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import InputTextControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlRenderer.vue'
  import { InputTextControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-text/inputTextControlTester'
  import InputPasswordControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-password/inputPasswordControlRenderer.vue'
  import { InputPasswordControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-password/inputPasswordControlTester'
  import InputNumberControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/input-number/inputNumberControlRenderer.vue'
  import { InputNumberControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/input-number/inputNumberControlTester'
  import TextareaControlRenderer from '@templates/form-fields-inputs/jsonform-custom-render/textarea/textareaControlRenderer.vue'
  import { TextareaControlTester } from '@templates/form-fields-inputs/jsonform-custom-render/textarea/textareaControlTester'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import OAuthGithub from './oauth-github.vue'

  const props = defineProps({
    schema: {
      type: Object,
      required: true
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const toast = useToast()
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')
  const selectedIntegration = ref('')

  const formData = ref({})
  const errors = ref([])
  const customRenderers = [
    {
      tester: InputTextControlTester,
      renderer: InputTextControlRenderer
    },
    {
      tester: InputPasswordControlTester,
      renderer: InputPasswordControlRenderer
    },
    {
      tester: InputNumberControlTester,
      renderer: InputNumberControlRenderer
    },
    {
      tester: TextareaControlTester,
      renderer: TextareaControlRenderer
    }
  ]
  const renderers = markRaw([...vanillaRenderers, ...customRenderers])

  const onChangeAzionForm = (event) => {
    formData.value = event.data
    errors.value = event.errors
  }

  const validateForm = () => {
    const hasJsonFormErrors = errors.value.length > 0

    if (hasJsonFormErrors) {
      return false
    }

    if (hasIntegrations.value) {
      const vcsField = props.schema.properties[vcsIntegrationFieldName.value]
      const isVcsRequired = vcsField?.attrs?.required || false

      if (isVcsRequired && !selectedIntegration.value) {
        return false
      }
    }

    return true
  }

  const getFormData = () => {
    const data = []

    if (hasIntegrations.value) {
      const vcsField = props.schema.properties[vcsIntegrationFieldName.value]
      data.push(
        parseData({
          name: vcsIntegrationFieldName.value,
          value: selectedIntegration.value,
          instantiationDataPath: vcsField?.instantiation_data_path || ''
        })
      )
    }

    const keys = Object.keys(formData.value)
    keys.forEach((key) => {
      const field = props.schema.properties[key]

      data.push(
        parseData({
          name: key,
          value: formData.value[key],
          instantiationDataPath: field.instantiation_data_path
        })
      )
    })

    return data
  }

  const parseData = (field) => {
    return {
      name: field.name,
      value: field.value,
      instantiation_data_path: field.instantiationDataPath
    }
  }

  const parsePropertiesSchema = (properties) => {
    const data = {}
    const keys = Object.keys(properties)

    keys.forEach((key) => {
      if (key !== 'platform_feature__vcs_integration__uuid') {
        data[key] = properties[key]
      }
    })

    return data
  }

  const hasIntegrations = computed(() => {
    const githubIntegration = props.schema.properties.platform_feature__vcs_integration__uuid
    const hasGithubIntegration = githubIntegration && Object.keys(githubIntegration).length > 0
    return hasGithubIntegration
  })

  const formSchema = computed(() => {
    const schema = { ...props.schema }
    schema.properties = parsePropertiesSchema(schema.properties)
    return schema
  })

  const hasIntegrationsList = computed(() => {
    return listOfIntegrations.value?.length > 0
  })

  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      oauthGithubRef.value.connectWithGithub()
    }
  }

  const listIntegrations = async () => {
    try {
      isIntegrationsLoading.value = true
      const data = await vcsService.listIntegrations()

      if (data && data.length > 0) {
        selectedIntegration.value = data[0].value
      }

      listOfIntegrations.value = data
    } catch (error) {
      error.showErrors(toast)
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
      error.showWithOptions(toast, (error) => ({
        summary: `GitHub integration failed: ${error.detail}`,
        severity: 'error'
      }))
    } finally {
      await listIntegrations()
    }
  }

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }

  const updateIntegrationValue = (installationId) => {
    selectedIntegration.value = installationId
  }

  const loadIntegrationOnShowButton = async () => {
    await listIntegrations()
    addEventListenerToGithubIntegration()
  }

  onMounted(async () => {
    if (hasIntegrations.value) {
      await loadIntegrationOnShowButton()
    }
  })

  onBeforeUnmount(() => {
    removeEventListenerToGithubIntegration()
  })

  watch(
    () => props.schema,
    async (newValue) => {
      const githubIntegration = newValue.properties?.platform_feature__vcs_integration__uuid
      const hasGithubIntegration = githubIntegration && Object.keys(githubIntegration).length > 0

      if (hasGithubIntegration) {
        await loadIntegrationOnShowButton()
      }
    },
    { deep: true }
  )

  defineExpose({ validateForm, getFormData })
</script>

<template>
  <div class="w-full grow flex flex-col gap-8 max-md:gap-6">
    <FormHorizontal
      v-if="hasIntegrations"
      title="GitHub Connection"
      :isDrawer="false"
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <OAuthGithub
            v-show="!hasIntegrationsList"
            ref="oauthGithubRef"
            @onCallbackUrl="setCallbackUrl"
            :loading="isIntegrationsLoading"
          />
          <div
            v-if="hasIntegrationsList"
            class="flex flex-col max-w-xs w-full gap-2"
          >
            <LabelBlock
              :for="vcsIntegrationFieldName"
              label="Git Scope"
              :isRequired="true"
            />
            <Dropdown
              :id="vcsIntegrationFieldName"
              :name="vcsIntegrationFieldName"
              :loading="isIntegrationsLoading"
              v-model="selectedIntegration"
              :options="listOfIntegrations"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a scope"
              @change="updateIntegrationValue(selectedIntegration)"
              class="w-full"
              appendTo="self"
            >
              <template #footer>
                <div class="p-dropdown-items-wrapper">
                  <ul class="p-dropdown-items">
                    <li
                      class="p-dropdown-item flex items-center cursor-pointer"
                      @click="triggerConnectWithGithub"
                    >
                      <i class="pi pi-plus-circle mr-2"></i>
                      <div>Add GitHub Account</div>
                    </li>
                  </ul>
                </div>
              </template>
            </Dropdown>
            <small class="text-xs font-normal text-color-secondary">
              Select the scope for this template.
            </small>
          </div>
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      :title="schema.title"
      :isDrawer="false"
    >
      <template #inputs>
        <div class="sm:max-w-lg">
          <JsonForms
            class="flex flex-col gap-8 max-md:gap-6"
            :data="formData"
            :schema="formSchema"
            :renderers="renderers"
            @change="onChangeAzionForm"
          />
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
