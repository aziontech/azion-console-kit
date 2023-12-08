<template>
  <FormLoading v-if="isLoading" />
  <div
    class="w-full flex flex-col gap-8 max-md:gap-6"
    v-else-if="!isLoading"
  >
    <FormHorizontal
      v-if="schema.fields"
      title="General"
    >
      <template #inputs>
        <div
          class="flex flex-col sm:max-w-lg w-full gap-2"
          v-for="field in removeHiddenFields(schema.fields)"
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
            :key="`password${field.name}`"
            :modelValue="field.value.value"
            @input="(event) => inputPassword(field.name, event.target.value)"
            id="name"
            class="w-full"
            :class="{ 'p-invalid': formTools.errors[field.name] }"
            :feedback="false"
          />
          <InputText
            v-else
            :key="field.name"
            id="name"
            type="text"
            v-bind="field.value"
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

    <div v-if="schema.groups">
      <FormHorizontal
        v-for="group in schema.groups"
        :key="group.name"
        :title="group.label"
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
              :key="`password${field.name}`"
              :modelValue="field.value.value"
              @input="(event) => inputPassword(field.name, event.target.value)"
              id="name"
              class="w-full"
              :class="{ 'p-invalid': formTools.errors[field.name] }"
              :feedback="false"
            />
            <InputText
              v-else
              :key="field.name"
              id="name"
              type="text"
              v-bind="field.value"
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
    <Teleport to="#action-bar">
      <ActionBarTemplate
        v-if="!isLoading"
        :loading="submitLoading"
        @onSubmit="validateAndSubmit"
        :submitDisabled="!formTools.meta.valid || !formTools.meta.touched"
      />
    </Teleport>
  </div>
</template>
<script setup>
  import Password from 'primevue/password'
  import { ref, onBeforeMount, defineOptions } from 'vue'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import ActionBarTemplate from '@templates/action-bar-block'
  import FormLoading from './FormLoading'
  import InputText from 'primevue/inputtext'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'templateEngineBlock' })

  const emit = defineEmits(['instantiate'])

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
    }
  })

  const toast = useToast()
  const schema = ref({})
  const validationSchema = ref()
  const formTools = ref({})
  const isLoading = ref(true)
  const submitLoading = ref(false)

  const loadTemplate = async (id) => {
    try {
      const initialData = await props.getTemplateService(id)
      schemaLoaded(initialData.inputSchema)
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

  const schemaLoaded = (inputSchema) => {
    schema.value = inputSchema
    const auxValidator = {}
    if (schema.value.fields) {
      schema.value.fields.forEach((element) => {
        auxValidator[element.name] = yup.string()
        if (element.attrs.required) {
          auxValidator[element.name] = auxValidator[element.name].required(
            `${element.label} is required`
          )
        }
        if (element.attrs.maxLength) {
          auxValidator[element.name] = auxValidator[element.name].max(
            element.attrs.maxLength,
            `This field cannot exceed ${element.attrs.maxLength} characters`
          )
        }
        if (element.attrs.minLength) {
          auxValidator[element.name] = auxValidator[element.name].max(
            element.attrs.minLength,
            `This field must have at least ${element.attrs.minLength} characters`
          )
        }
        if (element.validators) {
          element.validators.forEach((validator) => {
            auxValidator[element.name] = auxValidator[element.name].test(
              `valid-${element.name}`,
              validator.errorMessage,
              function (value) {
                const domainRegex = new RegExp(validator.regex)
                return domainRegex.test(value)
              }
            )
          })
        }
      })
    }
    if (schema.value.groups) {
      schema.value.groups.forEach((group) => {
        group.fields.forEach((element) => {
          auxValidator[element.name] = yup.string()
          if (element.attrs.required) {
            auxValidator[element.name] = auxValidator[element.name].required(
              `${element.label} is required`
            )
          }
          if (element.attrs.maxLength) {
            auxValidator[element.name] = auxValidator[element.name].max(
              element.attrs.maxLength,
              `This field cannot exceed ${element.attrs.maxLength} characters`
            )
          }
          if (element.attrs.minLength) {
            auxValidator[element.name] = auxValidator[element.name].max(
              element.attrs.minLength,
              `This field must have at least ${element.attrs.minLength} characters`
            )
          }
          if (element.validators) {
            element.validators.forEach((validator) => {
              auxValidator[element.name] = auxValidator[element.name].test(
                `valid-${element.name}`,
                validator.errorMessage,
                function (value) {
                  const domainRegex = new RegExp(validator.regex)
                  return domainRegex.test(value)
                }
              )
            })
          }
        })
      })
    }
    validationSchema.value = yup.object(auxValidator)

    formTools.value = { errors, meta, resetForm, values }
    if (schema.value.fields) {
      schema.value.fields.forEach((element) => {
        element.value = defineInputBinds(element.name, { validateOnInput: true })
      })
    }
    if (schema.value.groups) {
      schema.value.groups.forEach((group) => {
        group.fields.forEach((element) => {
          element.value = defineInputBinds(element.name, { validateOnInput: true })
        })
      })
    }
    isLoading.value = false
  }

  const { errors, meta, defineInputBinds, resetForm, values, setFieldValue } = useForm({
    validationSchema
  })

  const removeHiddenFields = (fields) => {
    return fields.filter((field) => !field.hidden)
  }

  const inputPassword = (inputName, text) => {
    setFieldValue(inputName, text)
  }

  const validateAndSubmit = async () => {
    submitLoading.value = true
    try {
      const payload = []
      if (schema.value.fields) {
        payload.push(...schema.value.fields)
      }
      if (schema.value.groups) {
        schema.value.groups.forEach((group) => {
          payload.push(...group.fields)
        })
      }
      payload.forEach((_, index) => {
        payload[index] = JSON.parse(JSON.stringify(payload[index]))
        const sanitizedField = {
          field: payload[index].name,
          instantiation_data_path: payload[index].instantiation_data_path,
          value: payload[index].value.value ? payload[index].value.value : ''
        }
        payload[index] = sanitizedField
      })
      const response = await props.instantiateTemplateService(props.templateId, payload)
      emit('instantiate', response)
      submitLoading.value = false
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }
</script>
