<template>
  <FormLoading v-if="isLoading" />
  <div
    class="w-full flex flex-col gap-8 max-md:gap-6"
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
            v-if="field.type === 'password'"
            toggleMask
            :key="`password-field-${field.name}`"
            v-bind="field.input"
            v-model="field.input.value"
            :id="field.name"
            class="w-full"
            :class="{ 'p-invalid': formTools.errors[field.name] }"
            :feedback="false"
          />
          <InputText
            v-else
            :key="field.name"
            :id="field.name"
            type="text"
            v-bind="field.input"
            :class="{ 'p-invalid': formTools.errors[field.name] }"
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

    <div v-if="inputSchema.groups">
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
            <label
              for="name"
              class="text-color text-base font-medium"
              >{{ field.label }}
              <span v-if="field.attrs"><span v-if="field.attrs.required">*</span></span></label
            >
            <Password
              v-if="field.type === 'password'"
              toggleMask
              :key="`password-field-${field.name}`"
              v-bind="field.input"
              v-model="field.input.value"
              :id="field.name"
              class="w-full"
              :class="{ 'p-invalid': formTools.errors[field.name] }"
              :feedback="false"
            />
            <InputText
              v-else
              :key="field.name"
              :id="field.name"
              type="text"
              v-bind="field.input"
              :class="{ 'p-invalid': formTools.errors[field.name] }"
            />
            <small class="tet-xs font-normal text-color-secondary">{{ field.description }}</small>
            <small
              v-if="formTools.errors[field.name]"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ formTools.errors[field.name] }}
            </small>
          </div>
        </template>
      </FormHorizontal>
    </div>
    <Teleport
      :to="actionBarId"
      v-if="isMounted"
    >
      <ActionBarTemplate
        v-if="!isLoading"
        :loading="submitLoading"
        @onSubmit="validateAndSubmit"
        @onCancel="handleCancel"
        :submitDisabled="!formTools.meta.valid || !formTools.meta.touched"
      />
    </Teleport>
  </div>
</template>

<script setup>
  import Password from 'primevue/password'
  import { ref, onBeforeMount, defineOptions, watch, onMounted } from 'vue'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import ActionBarTemplate from '@templates/action-bar-block'
  import FormLoading from './FormLoading'
  import InputText from 'primevue/inputtext'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'

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
  const isMounted = ref(false)

  const loadTemplate = async (id) => {
    try {
      const initialData = await props.getTemplateService(id)
      inputSchema.value = initialData.inputSchema
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

  onBeforeMount(async () => {
    await loadTemplate(props.templateId)
  })

  onMounted(() => {
    setTimeout(() => {
      isMounted.value = true
    }, 100)
  })

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

    formTools.value = { errors, meta, resetForm, values }

    inputSchema.value.fields?.forEach((field) => {
      if (field.value) {
        setFieldValue(field.name, field.value)
      }
      field.input = defineInputBinds(field.name, { validateOnInput: true })
    })

    inputSchema.value.groups?.forEach((group) => {
      group.fields.forEach((field) => {
        if (field.value) {
          setFieldValue(field.name, field.value)
        }
        field.input = defineInputBinds(field.name, { validateOnInput: true })
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

  const validateAndSubmit = async () => {
    emit('submitClick')
    submitLoading.value = true
    emit('loading')
    try {
      const payload = []
      if (inputSchema.value.fields) {
        payload.push(...inputSchema.value.fields)
      }
      if (inputSchema.value.groups) {
        inputSchema.value.groups.forEach((group) => {
          payload.push(...group.fields)
        })
      }
      payload.forEach((__, index) => {
        payload[index] = JSON.parse(JSON.stringify(payload[index]))
        const sanitizedField = {
          field: payload[index].name,
          instantiation_data_path: payload[index].instantiation_data_path,
          value: payload[index].input.value ? payload[index].input.value : ''
        }

        // Hidden field
        const hiddenField = props.hiddenFields.find((field) => field.name === payload[index].name)
        if (hiddenField) {
          sanitizedField.value = hiddenField.value
        }

        payload[index] = sanitizedField
      })

      const response = await props.instantiateTemplateService(props.templateId, payload)
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

  watch(
    () => props.freezeLoading,
    () => {
      // Finished the opeations after instantiate
      submitLoading.value = false
    }
  )
</script>
