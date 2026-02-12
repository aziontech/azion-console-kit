<script setup>
  import { ref, defineOptions, watch, onMounted, computed, onBeforeUnmount } from 'vue'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import { useToast } from 'primevue/usetoast'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import LabelBlock from '@/templates/label-block'
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import OAuthGithub from './oauth-github.vue'

  defineOptions({ name: 'engineAzion' })

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
  const inputSchema = ref(props.schema)
  const formTools = ref({})
  const isFormReady = ref(false)
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)
  const oauthGithubRef = ref(null)
  const vcsIntegrationFieldName = ref('platform_feature__vcs_integration__uuid')
  const setIntegration = ref('')

  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      oauthGithubRef.value[0].connectWithGithub()
    }
  }

  onMounted(async () => {
    await initializeForm()
  })

  onBeforeUnmount(() => {
    removeEventListenerToGithubIntegration()
  })

  const extractFieldNames = (groups) => {
    return groups.flatMap((group) => group.fields.map((field) => field.name))
  }

  const loadIntegrationOnShowButton = async () => {
    await listIntegrations()
    addEventListenerToGithubIntegration()
  }

  const initializeForm = async () => {
    try {
      const schemaObject = await createSchemaObject()
      const isValid = await schemaObject.isValid()
      await createInputs(schemaObject, isValid)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const listIntegrations = async () => {
    try {
      isIntegrationsLoading.value = true
      const data = await vcsService.listIntegrations()

      if (data && data.length > 0) {
        formTools.value.setFieldValue(vcsIntegrationFieldName.value, data[0].value)
        setIntegration.value = data[0].value
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

  const escapeErrorMessage = (errorMessage) => {
    return errorMessage.replaceAll('${', '#$')
  }

  const unescapeErrorMessage = (errorMessage) => {
    return errorMessage.replaceAll('#$', '${')
  }

  const renderInvalidClass = (containErrorInField) => {
    return containErrorInField ? 'p-invalid' : ''
  }

  const hasIntegrations = computed(() => {
    return listOfIntegrations?.value?.length > 0 ? true : false
  })

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

  const createSchemaObject = async () => {
    const templateSchema = {}

    inputSchema.value.fields?.forEach((field) => {
      const schema = createSchemaString(field)
      templateSchema[field.name] = schema
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        const schema = createSchemaString(field)
        templateSchema[field.name] = schema
      })
    })

    const resultSchema = yup.object(templateSchema)

    return resultSchema
  }

  const createSchemaString = (element) => {
    let schema = yup.string()

    if (element.hidden) return schema

    if (element.attrs.required) {
      schema = schema.required(`${element.label} is required`)
    }

    if (element.attrs.maxLength) {
      schema = schema.max(
        element.attrs.maxLength,
        `This field cannot exceed ${element.attrs.maxLength} characters`
      )
    }

    if (element.attrs.minLength) {
      schema = schema.max(
        element.attrs.minLength,
        `This field must have at least ${element.attrs.minLength} characters`
      )
    }

    if (element.validators) {
      element.validators.forEach((validator) => {
        schema = schema.test(
          `valid-${element.name}`,
          escapeErrorMessage(validator.errorMessage),
          function (value) {
            const domainRegex = new RegExp(validator.regex)
            const shouldEscapeEmptyAndNotRequiredFields =
              value === undefined && !element.attrs.required
            if (shouldEscapeEmptyAndNotRequiredFields) return true
            return domainRegex.test(value)
          }
        )
      })
    }

    if (element.value.length > 0) {
      schema = schema.default(element.value)
    }

    return schema
  }

  const createInputs = async (validationSchema, isValid) => {
    const {
      errors,
      meta,
      setTouched,
      defineInputBinds,
      resetForm,
      values,
      validate,
      setFieldValue
    } = useForm({
      validationSchema
    })

    formTools.value = { errors, meta, resetForm, values, setFieldValue, validate }

    const registerFieldWithValueAndValidation = (field) => {
      if (field.value) {
        setFieldValue(field.name, field.value)
      }
      field.input = defineInputBinds(field.name, { validateOnInput: true })
    }

    inputSchema.value.fields?.forEach((field) => {
      registerFieldWithValueAndValidation(field)
    })

    inputSchema.value.groups?.forEach(({ fields }) => {
      fields.forEach((field) => {
        registerFieldWithValueAndValidation(field)
      })
    })

    // If all fields is valid on load, allow submit
    if (isValid) {
      await validate()
      setTouched(true)
    }

    isFormReady.value = true
  }

  const removeHiddenFields = (fields) => {
    return fields.filter((field) => !field.hidden)
  }

  const getFormData = () => {
    const parsedInputSchema = []
    if (inputSchema.value.fields) {
      parsedInputSchema.push(...inputSchema.value.fields)
    }
    if (inputSchema.value.groups) {
      const fieldsInsideTheFieldGroup = inputSchema.value.groups.flatMap((group) => group.fields)
      parsedInputSchema.push(...fieldsInsideTheFieldGroup)
    }
    return parsedInputSchema
  }

  const validateForm = async () => {
    await formTools.value.validate()
    return Object.keys(formTools.value.errors).length === 0
  }

  const updateValueOnChange = (field, installationId) => {
    formTools.value.setFieldValue(field, installationId)
  }

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }

  const isHandleField = (field) => {
    if (field !== 'repository_name') return true
    return hasIntegrations.value
  }

  watch(
    () => props.schema,
    async (newValue) => {
      inputSchema.value = newValue
      const groupsToCheck = newValue.groups || []
      const fieldNames = extractFieldNames(groupsToCheck)

      if (fieldNames.includes(vcsIntegrationFieldName.value)) {
        await loadIntegrationOnShowButton()
      }
    },
    { deep: true }
  )

  defineExpose({
    validateForm,
    getFormData,
    formTools,
    inputSchema
  })
</script>

<template>
  <div
    v-if="isFormReady"
    class="w-full grow flex flex-col gap-8 max-md:gap-6"
  >
    <FormHorizontal
      v-if="inputSchema.fields"
      title="General"
      :isDrawer="props.isDrawer"
    >
      <template #inputs>
        <div
          class="flex flex-col sm:max-w-lg w-full gap-2"
          v-for="field in removeHiddenFields(inputSchema.fields)"
          :key="field.name"
        >
          <LabelBlock
            for="name"
            :label="field.label"
            :isRequired="field.attrs && field.attrs.required"
          />
          <Password
            autocomplete="off"
            v-if="field.type === 'password'"
            toggleMask
            :key="`password-field-${field.name}`"
            v-bind="field.input"
            v-model="field.input.value"
            :id="field.name"
            class="w-full"
            :class="renderInvalidClass(formTools.errors[`${field.name}`])"
            :feedback="false"
            :pt="{
              input: {
                name: `${field.name}`
              }
            }"
          />
          <InputText
            v-else
            autocomplete="off"
            :key="field.name"
            :id="field.name"
            type="text"
            v-bind="field.input"
            :name="field.name"
            :class="renderInvalidClass(formTools.errors[`${field.name}`])"
          />
          <small class="text-xs font-normal text-color-secondary">{{ field.description }}</small>
          <small
            v-if="formTools.errors[field.name]"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ unescapeErrorMessage(formTools.errors[field.name]) }}
          </small>
        </div>
      </template>
    </FormHorizontal>

    <div
      class="w-full grow flex flex-col gap-8 max-md:gap-6"
      v-if="inputSchema.groups"
    >
      <FormHorizontal
        v-for="group in inputSchema.groups"
        :key="group.name"
        :title="group.label"
        :isDrawer="props.isDrawer"
      >
        <template #inputs>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-for="field in removeHiddenFields(group.fields)"
            :key="field.name"
          >
            <div v-if="field.name === vcsIntegrationFieldName">
              <OAuthGithub
                v-show="!hasIntegrations"
                ref="oauthGithubRef"
                @onCallbackUrl="
                  (uri) => {
                    setCallbackUrl(uri)
                  }
                "
                :loading="isIntegrationsLoading"
              />
              <div
                v-if="hasIntegrations"
                class="flex flex-col max-w-xs w-full gap-2"
              >
                <FieldDropdown
                  :options="listOfIntegrations"
                  :name="field.name"
                  :required="field.attrs.required"
                  :label="field.label"
                  :value="setIntegration"
                  placeholder="Select a scope"
                  :description="field.description"
                  :inputClass="renderInvalidClass(formTools.errors[`${field.name}`])"
                  optionLabel="label"
                  optionValue="value"
                  @onChange="
                    (installationId) => {
                      updateValueOnChange(field.name, installationId)
                    }
                  "
                >
                  <template #footer>
                    <div class="p-dropdown-items-wrapper">
                      <ul class="p-dropdown-items">
                        <li
                          class="p-dropdown-item flex items-center"
                          @click="triggerConnectWithGithub"
                        >
                          <i class="pi pi-plus-circle mr-2"></i>
                          <div>Add GitHub Account</div>
                        </li>
                      </ul>
                    </div>
                  </template>
                </FieldDropdown>
              </div>
            </div>
            <div v-else>
              <div
                class="flex flex-col sm:max-w-lg w-full gap-2"
                v-if="isHandleField(field.name)"
              >
                <LabelBlock
                  for="name"
                  :label="field.label"
                  :isRequired="field.attrs && field.attrs.required"
                />
                <Password
                  v-if="field.type === 'password'"
                  autocomplete="off"
                  toggleMask
                  :key="`password-field-${field.name}`"
                  v-bind="field.input"
                  v-model="field.input.value"
                  :id="field.name"
                  class="w-full"
                  :class="renderInvalidClass(formTools.errors[`${field.name}`])"
                  :feedback="false"
                  :pt="{
                    input: {
                      name: `${field.name}`
                    }
                  }"
                />
                <InputText
                  v-else
                  autocomplete="off"
                  :key="field.name"
                  :id="field.name"
                  type="text"
                  v-bind="field.input"
                  :class="renderInvalidClass(formTools.errors[`${field.name}`])"
                  :name="field.name"
                />
                <small class="tet-xs font-normal text-color-secondary">{{
                  field.description
                }}</small>
                <small
                  v-if="formTools.errors[field.name]"
                  class="p-error text-xs font-normal leading-tight"
                >
                  {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                </small>
              </div>
            </div>
          </div>
        </template>
      </FormHorizontal>
    </div>
  </div>
</template>
