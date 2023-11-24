<template>
  <div v-if="!isLoading">
    <TemplateEngineBlock
      :getTemplateService="getTemplateService"
      :getSolutionService="getSolutionService"
      :createService="postTemplateService"
      :solution="solutionPayload"
      :cleanFormCallback="formTools.resetForm"
      :formData="schema"
      :formMeta="formTools.meta"
    >
      <template
        #form
        v-if="schema"
      >
        <FormHorizontal
          v-if="schema.fields"
          title="General"
        >
          <template #inputs>
            <div
              class="flex flex-col sm:max-w-lg w-full gap-2"
              v-for="field in schema.fields.filter((element) => !element.hidden)"
              :key="field.name"
            >
              <label
                for="name"
                class="text-color text-base font-medium"
                >{{ field.label }}
                <span v-if="field.attrs"><span v-if="field.attrs.required">*</span></span></label
              >
              <InputText
                :key="field.name"
                id="name"
                :type="field.type === 'textfield' ? 'text' : 'password'"
                v-bind="field.value"
                :class="{ 'p-invalid': formTools.errors[field.name] }"
              />
              <small class="text-xs font-normal text-color-secondary">{{
                field.description
              }}</small>
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
                v-for="field in group.fields.filter((element) => !element.hidden)"
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
                <small class="tet-xs font-normal text-color-secondary">{{
                  field.description
                }}</small>
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
      </template>
    </TemplateEngineBlock>
  </div>
</template>
<script>
  import { ref, onBeforeMount, getCurrentInstance } from 'vue'
  import Password from 'primevue/password'
  import FormHorizontal from '@templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import TemplateEngineBlock from '@templates/template-engine-block'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    components: {
      FormHorizontal,
      InputText,
      TemplateEngineBlock,
      Password
    },
    props: {
      getTemplateService: {
        type: Function,
        required: true
      },
      postTemplateService: {
        type: Function
      },
      getSolutionService: {
        type: Function,
        required: true
      }
    },
    setup(props) {
      const schema = ref({})
      const validationSchema = ref()
      const formTools = ref({})
      const isLoading = ref(true)
      const solutionPayload = ref()
      const $route = getCurrentInstance().appContext.config.globalProperties.$route
      const $toast = getCurrentInstance().appContext.config.globalProperties.$toast

      const loadSolution = async () => {
        try {
          isLoading.value = true
          const { vendor, solution } = $route.params
          solutionPayload.value = await props.getSolutionService(vendor, solution)
          await loadTemplate()
        } catch (error) {
          $toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        }
      }
      const loadTemplate = async () => {
        try {
          const initialData = await props.getTemplateService(solutionPayload.value.referenceId)
          schemaLoaded(initialData.inputSchema)
        } catch (error) {
          $toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        }
      }
      onBeforeMount(async () => {
        await loadSolution()
      })
      const schemaLoaded = (inputSchema) => {
        schema.value = inputSchema
        const auxValidator = {}
        if (schema.value.fields) {
          schema.value.fields.forEach((element) => {
            auxValidator[element.name] = yup.string()
            if (element.attrs.required) {
              auxValidator[element.name] =
                auxValidator[element.name].required('This field is required')
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
                auxValidator[element.name] =
                  auxValidator[element.name].required('This field is required')
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
        validationSchema,
        initialValues: {
          gh_token: 'test'
        }
      })

      const inputPassword = (inputName, text) => {
        setFieldValue(inputName, text)
      }

      return {
        formTools,
        schema,
        validationSchema,
        isLoading,
        solutionPayload,
        loadSolution,
        loadTemplate,
        schemaLoaded,
        setFieldValue,
        inputPassword
      }
    }
  }
</script>
