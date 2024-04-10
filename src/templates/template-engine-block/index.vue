<template>
  <FormLoading v-if="isLoading" />

  <div
    class="w-full grow flex flex-col gap-8 max-md:gap-6"
    v-else
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
          <label
            for="name"
            class="text-color text-base font-medium"
            >{{ field.label }}
            <span v-if="field.attrs"><span v-if="field.attrs.required">*</span></span></label
          >
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
          />
          <InputText
            v-else
            autocomplete="off"
            :key="field.name"
            :id="field.name"
            type="text"
            v-bind="field.input"
            :class="renderInvalidClass(formTools.errors[`${field.name}`])"
          />
          <small class="text-xs font-normal text-color-secondary">{{ field.description }}</small>
          <small
            v-if="formTools.errors[field.name]"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ formTools.errors[field.name] }}
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
            <div v-if="field.name === 'installation_id'">
              <div
                v-if="hasIntegrations"
                class="flex flex-col sm:max-w-lg w-full gap-2"
              >
                <FieldDropdown
                  :options="listOfIntegrations"
                  :name="field.name"
                  :label="field.label"
                  :placeholder="field.placeholder"
                  :description="field.description"
                  :inputClass="renderInvalidClass(formTools.errors[`${field.name}`])"
                  optionLabel="label"
                  optionValue="value"
                  @onChange="
                    (installationId) => {
                      updateValueOnChange(field.name, installationId)
                    }
                  "
                />
              </div>
              <OAuthGithub
                :listPlatformsService="listPlatformsService"
                @onCallbackUrl="
                  (uri) => {
                    setCallbackUrl(uri.value)
                  }
                "
                :loading="isIntegrationsLoading"
                v-else
              />
            </div>
            <div
              v-else
              class="flex flex-col sm:max-w-lg w-full gap-2"
            >
              <label
                for="name"
                class="text-color text-base font-medium"
                >{{ field.label }}
                <span v-if="field.attrs"><span v-if="field.attrs.required">*</span></span></label
              >
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
              />
              <InputText
                v-else
                autocomplete="off"
                :key="field.name"
                :id="field.name"
                type="text"
                v-bind="field.input"
                :class="renderInvalidClass(formTools.errors[`${field.name}`])"
              />
              <small class="tet-xs font-normal text-color-secondary">{{ field.description }}</small>
              <small
                v-if="formTools.errors[field.name]"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ formTools.errors[field.name] }}
              </small>
            </div>
          </div>
        </template>
      </FormHorizontal>
    </div>
    <Teleport :to="actionBarId">
      <ActionBarTemplate
        v-if="!isLoading"
        :loading="submitLoading"
        @onSubmit="handleSubmit"
        @onCancel="handleCancel"
        :submitDisabled="!formTools.meta.valid || !formTools.meta.touched"
      />
    </Teleport>
  </div>
</template>

<script setup>
  import Password from 'primevue/password'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import { ref, defineOptions, watch, onMounted, computed } from 'vue'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import ActionBarTemplate from '@templates/action-bar-block'
  import FormLoading from './form-loading'
  import InputText from 'primevue/inputtext'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import OAuthGithub from './oauth-github.vue'

  defineOptions({ name: 'templateEngineBlock' })

  const emit = defineEmits(['instantiate', 'cancel', 'submitClick'])

  const props = defineProps({
    getTemplateService: {
      type: Function,
      required: true
    },
    instantiateTemplateService: {
      type: Function
    },
    postCallbackUrlService: {
      type: Function,
      required: true
    },
    listPlatformsService: {
      type: Function
    },
    listIntegrationsService: {
      type: Function
    },
    templateId: {
      type: String,
      required: true
    },
    actionBarId: {
      type: String,
      default: '#action-bar'
    },
    hiddenFields: {
      type: Array,
      required: false,
      default: () => []
    },
    freezeLoading: {
      type: Boolean,
      default: false
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const toast = useToast()
  const inputSchema = ref({})
  const formTools = ref({})
  const isLoading = ref(true)
  const submitLoading = ref(false)
  const callbackUrl = ref('')
  const listOfIntegrations = ref([])
  const isIntegrationsLoading = ref(false)

  onMounted(async () => {
    await loadTemplate(props.templateId)
    await listIntegrations()

    listenerOnMessage()
  })

  const loadTemplate = async () => {
    try {
      const templateData = await props.getTemplateService(props.templateId)
      inputSchema.value = templateData.inputSchema
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
      const data = await props.listIntegrationsService()

      listOfIntegrations.value = data
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      isIntegrationsLoading.value = false
    }
  }

  const listenerOnMessage = () => {
    window.addEventListener('message', (event) => {
      if (event.data.event === 'integration-data') {
        saveIntegration(event.data)
      }
    })
  }

  const renderInvalidClass = (containErrorInField) => {
    if (containErrorInField) return 'p-invalid'
    return ''
  }

  const hasIntegrations = computed(() => {
    if (listOfIntegrations?.value?.length > 0) return true
    return false
  })

  const saveIntegration = async (integration) => {
    isIntegrationsLoading.value = true
    await props.postCallbackUrlService(callbackUrl.value, integration.data)
    await listIntegrations()
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
        schema = schema.test(`valid-${element.name}`, validator.errorMessage, function (value) {
          const domainRegex = new RegExp(validator.regex)
          return domainRegex.test(value)
        })
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

    formTools.value = { errors, meta, resetForm, values, setFieldValue }

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

    isLoading.value = false

    // If all fields is valid on load, allow submit
    if (isValid) {
      await validate()
      setTouched(true)
    }
  }

  const removeHiddenFields = (fields) => {
    return fields.filter((field) => !field.hidden)
  }

  const handleSubmit = async () => {
    try {
      submitLoading.value = true
      emit('submitClick')
      emit('loading')

      const parsedInputSchema = []
      if (inputSchema.value.fields) {
        parsedInputSchema.push(...inputSchema.value.fields)
      }
      if (inputSchema.value.groups) {
        const fieldsInsideTheFieldGroup = inputSchema.value.groups.flatMap((group) => group.fields)
        parsedInputSchema.push(...fieldsInsideTheFieldGroup)
      }
      const instantiateParsedPayload = parsedInputSchema.map((__, index) => {
        const parsedField = {
          field: parsedInputSchema[index].name,
          instantiation_data_path: parsedInputSchema[index].instantiation_data_path,
          value: parsedInputSchema[index].input.value ?? ''
        }

        const hiddenField = props.hiddenFields.find(
          (field) => field.name === parsedInputSchema[index].name
        )
        if (hiddenField) {
          parsedField.value = hiddenField.value
        }
        return parsedField
      })

      const response = await props.instantiateTemplateService(
        props.templateId,
        instantiateParsedPayload
      )
      submitLoading.value = props.freezeLoading
      emit('instantiate', response)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const handleCancel = () => {
    emit('cancel')
  }

  const updateValueOnChange = (field, installationId) => {
    formTools.value.setFieldValue(field, installationId)
  }

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }

  watch(
    () => props.freezeLoading,
    () => {
      // Finished the operations after instantiate
      submitLoading.value = false
    }
  )
</script>
