<script setup>
  import { ref, defineOptions, watch, computed } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import LabelBlock from '@/templates/label-block'
  import LayoutEngineBlock from './layout-engine-block.vue'
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

  const layoutRef = ref(null)
  const inputSchema = ref(props.schema)
  const formTools = ref({})
  const isFormReady = ref(false)
  const setIntegration = ref('')
  const oauthGithubRef = ref(null)
  const isInitialized = ref(false)

  const vcsIntegrationFieldName = 'platform_feature__vcs_integration__uuid'

  const hasIntegrations = computed(() => {
    return layoutRef.value?.hasIntegrationsList?.value ?? false
  })

  const listOfIntegrations = computed(() => {
    return layoutRef.value?.listOfIntegrations?.value ?? []
  })

  const isIntegrationsLoading = computed(() => {
    return layoutRef.value?.isIntegrationsLoading?.value ?? false
  })

  const groupedRows = computed(() => {
    const rows = []
    const singleFieldGroups = []

    for (const group of inputSchema.value.groups || []) {
      const visibleFields = (group.fields || []).filter((field) => !field.hidden)
      if (visibleFields.length === 1) {
        singleFieldGroups.push(group)
        if (singleFieldGroups.length === 2) {
          rows.push({ type: 'pair', groups: [...singleFieldGroups] })
          singleFieldGroups.length = 0
        }
      } else {
        // Flush any pending single-field group before inserting a multi-field
        if (singleFieldGroups.length) {
          rows.push({ type: 'single', groups: [singleFieldGroups.shift()] })
        }
        rows.push({ type: 'single', groups: [group] })
      }
    }

    // Flush remaining odd group
    if (singleFieldGroups.length) {
      rows.push({ type: 'single', groups: [singleFieldGroups.shift()] })
    }

    return rows
  })

  const extractFieldNames = (groups) => {
    return groups.flatMap((group) => group.fields.map((field) => field.name))
  }

  const createSchemaObject = async () => {
    const templateSchema = {}

    inputSchema.value.fields?.forEach((field) => {
      templateSchema[field.name] = createSchemaString(field)
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        templateSchema[field.name] = createSchemaString(field)
      })
    })

    return yup.object(templateSchema)
  }

  const createSchemaString = (element) => {
    let schema = yup.string()

    if (element.hidden) return schema

    if (element.attrs?.required) {
      schema = schema.required(`${element.label} is required`)
    }

    if (element.attrs?.maxLength) {
      schema = schema.max(
        element.attrs.maxLength,
        `This field cannot exceed ${element.attrs.maxLength} characters`
      )
    }

    if (element.attrs?.minLength) {
      schema = schema.min(
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
              value === undefined && !element.attrs?.required
            if (shouldEscapeEmptyAndNotRequiredFields) return true
            return domainRegex.test(value)
          }
        )
      })
    }

    if (element.value?.length > 0) {
      schema = schema.default(element.value)
    }

    return schema
  }

  const initializeForm = async () => {
    try {
      const schemaObject = await createSchemaObject()
      const isValid = await schemaObject.isValid()
      await createInputs(schemaObject, isValid)
    } catch (error) {
      layoutRef.value?.toast?.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
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

    if (isValid) {
      await validate()
      setTouched(true)
    }

    isFormReady.value = true
    isInitialized.value = true
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

  const removeHiddenFields = (fields) => {
    return fields.filter((field) => !field.hidden)
  }

  const isHandleField = (field) => {
    if (field !== 'repository_name') return true
    return hasIntegrations.value
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

  const triggerConnectWithGithub = () => {
    layoutRef.value?.triggerConnectWithGithub?.()
  }

  const setCallbackUrl = (uri) => {
    layoutRef.value?.setCallbackUrl?.(uri)
  }

  watch(
    () => props.schema,
    async (newValue) => {
      if (!newValue) return
      if (isInitialized.value) return

      inputSchema.value = newValue
      const groupsToCheck = newValue.groups || []
      const fieldNames = extractFieldNames(groupsToCheck)

      if (fieldNames.includes(vcsIntegrationFieldName)) {
        await layoutRef.value?.loadIntegrationOnShowButton()
      }

      await initializeForm()
    },
    { immediate: true }
  )

  defineExpose({
    validateForm,
    getFormData,
    formTools,
    inputSchema
  })
</script>

<template>
  <div class="flex justify-center">
    <LayoutEngineBlock
      ref="layoutRef"
      v-bind="$attrs"
      :schema="props.schema"
      :is-drawer="props.isDrawer"
    >
      <template #inputs>
        <template v-if="isFormReady">
          <div
            v-if="inputSchema.fields"
            class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full"
          >
            <template
              v-for="field in removeHiddenFields(inputSchema.fields)"
              :key="field.name"
            >
              <div
                v-if="field.name === vcsIntegrationFieldName"
                class="flex flex-col gap-2"
              >
                <OAuthGithub
                  v-show="!hasIntegrations"
                  ref="oauthGithubRef"
                  @onCallbackUrl="setCallbackUrl"
                  :loading="isIntegrationsLoading"
                />
                <div
                  v-if="hasIntegrations"
                  class="flex flex-col gap-2"
                >
                  <FieldDropdown
                    :options="listOfIntegrations"
                    :name="field.name"
                    :required="field.attrs?.required"
                    :label="field.label"
                    :value="setIntegration"
                    placeholder="Select a scope"
                    :description="field.description"
                    :inputClass="renderInvalidClass(formTools.errors[field.name])"
                    optionLabel="label"
                    optionValue="value"
                    @onChange="(installationId) => updateValueOnChange(field.name, installationId)"
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
              <div
                v-else-if="isHandleField(field.name)"
                class="flex flex-col gap-2"
              >
                <LabelBlock
                  :for="field.name"
                  :label="field.label"
                  :isRequired="field.attrs?.required"
                />
                <Password
                  v-if="field.type === 'password'"
                  autocomplete="off"
                  toggleMask
                  v-bind="field.input"
                  v-model="field.input.value"
                  :id="field.name"
                  class="w-full"
                  :class="renderInvalidClass(formTools.errors[field.name])"
                  :feedback="false"
                  :pt="{ input: { name: field.name } }"
                />
                <InputText
                  v-else
                  autocomplete="off"
                  :id="field.name"
                  type="text"
                  v-bind="field.input"
                  :name="field.name"
                  :class="renderInvalidClass(formTools.errors[field.name])"
                />
                <small class="text-xs font-normal text-color-secondary">{{
                  field.description
                }}</small>
                <small
                  v-if="formTools.errors[field.name]"
                  class="p-error text-xs font-normal leading-tight"
                >
                  {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                </small>
              </div>
            </template>
          </div>

          <div
            v-if="inputSchema.groups"
            class="flex flex-col gap-8 w-full"
          >
            <template
              v-for="row in groupedRows"
              :key="row.groups[0].name"
            >
              <!-- Pair: 2 single-field groups side by side -->
              <div
                v-if="row.type === 'pair'"
                class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
              >
                <template
                  v-for="group in row.groups"
                  :key="group.name"
                >
                  <div class="flex flex-col gap-2">
                    <template
                      v-for="field in removeHiddenFields(group.fields)"
                      :key="field.name"
                    >
                      <div
                        v-if="field.name === vcsIntegrationFieldName"
                        class="flex flex-col gap-2"
                      >
                        <OAuthGithub
                          v-show="!hasIntegrations"
                          ref="oauthGithubRef"
                          @onCallbackUrl="setCallbackUrl"
                          :loading="isIntegrationsLoading"
                        />
                        <div
                          v-if="hasIntegrations"
                          class="flex flex-col gap-2"
                        >
                          <FieldDropdown
                            :options="listOfIntegrations"
                            :name="field.name"
                            :required="field.attrs?.required"
                            :label="field.label"
                            :value="setIntegration"
                            placeholder="Select a scope"
                            :description="field.description"
                            :inputClass="renderInvalidClass(formTools.errors[field.name])"
                            optionLabel="label"
                            optionValue="value"
                            @onChange="
                              (installationId) => updateValueOnChange(field.name, installationId)
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
                      <div
                        v-else-if="isHandleField(field.name)"
                        class="flex flex-col gap-2"
                      >
                        <LabelBlock
                          :for="field.name"
                          :label="field.label"
                          :isRequired="field.attrs?.required"
                        />
                        <Password
                          v-if="field.type === 'password'"
                          autocomplete="off"
                          toggleMask
                          v-bind="field.input"
                          v-model="field.input.value"
                          :id="field.name"
                          class="w-full"
                          :class="renderInvalidClass(formTools.errors[field.name])"
                          :feedback="false"
                          :pt="{ input: { name: field.name } }"
                        />
                        <InputText
                          v-else
                          autocomplete="off"
                          :id="field.name"
                          type="text"
                          v-bind="field.input"
                          :class="renderInvalidClass(formTools.errors[field.name])"
                          :name="field.name"
                        />
                        <small class="text-xs font-normal text-color-secondary">{{
                          field.description
                        }}</small>
                        <small
                          v-if="formTools.errors[field.name]"
                          class="p-error text-xs font-normal leading-tight"
                        >
                          {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                        </small>
                      </div>
                    </template>
                  </div>
                </template>
              </div>

              <!-- Single: 1 group in full width -->
              <div
                v-else
                class="flex flex-col gap-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <template
                    v-for="field in removeHiddenFields(row.groups[0].fields)"
                    :key="field.name"
                  >
                    <div
                      v-if="field.name === vcsIntegrationFieldName"
                      class="flex flex-col gap-2"
                    >
                      <OAuthGithub
                        v-show="!hasIntegrations"
                        ref="oauthGithubRef"
                        @onCallbackUrl="setCallbackUrl"
                        :loading="isIntegrationsLoading"
                      />
                      <div
                        v-if="hasIntegrations"
                        class="flex flex-col gap-2"
                      >
                        <FieldDropdown
                          :options="listOfIntegrations"
                          :name="field.name"
                          :required="field.attrs?.required"
                          :label="field.label"
                          :value="setIntegration"
                          placeholder="Select a scope"
                          :description="field.description"
                          :inputClass="renderInvalidClass(formTools.errors[field.name])"
                          optionLabel="label"
                          optionValue="value"
                          @onChange="
                            (installationId) => updateValueOnChange(field.name, installationId)
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
                    <div
                      v-else-if="isHandleField(field.name)"
                      class="flex flex-col gap-2"
                    >
                      <LabelBlock
                        :for="field.name"
                        :label="field.label"
                        :isRequired="field.attrs?.required"
                      />
                      <Password
                        v-if="field.type === 'password'"
                        autocomplete="off"
                        toggleMask
                        v-bind="field.input"
                        v-model="field.input.value"
                        :id="field.name"
                        class="w-full"
                        :class="renderInvalidClass(formTools.errors[field.name])"
                        :feedback="false"
                        :pt="{ input: { name: field.name } }"
                      />
                      <InputText
                        v-else
                        autocomplete="off"
                        :id="field.name"
                        type="text"
                        v-bind="field.input"
                        :class="renderInvalidClass(formTools.errors[field.name])"
                        :name="field.name"
                      />
                      <small class="text-xs font-normal text-color-secondary">{{
                        field.description
                      }}</small>
                      <small
                        v-if="formTools.errors[field.name]"
                        class="p-error text-xs font-normal leading-tight"
                      >
                        {{ unescapeErrorMessage(formTools.errors[field.name]) }}
                      </small>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </template>
      </template>
    </LayoutEngineBlock>
  </div>
</template>
