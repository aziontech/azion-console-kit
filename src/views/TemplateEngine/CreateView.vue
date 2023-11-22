<template>
  <div v-if="!isLoading">
    <TemplateEngineBlock
      :getTemplateService="props.getTemplateService"
      :getSolutionService="props.getSolutionService"
      :createService="props.postTemplateService"
      :solution="solutionPayload"
      @schema-loaded="schemaLoaded"
      :formData="schema"
      :formMeta="formTools.meta"
      :cleanFormCallback="formTools.resetForm"
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
                >{{ field.label }} <span v-if="field.attrs.required">*</span></label
              >
              <InputText
                :key="field.name"
                id="name"
                type="text"
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
                  >{{ field.label }} <span v-if="field.attrs.required">*</span></label
                >
                <InputText
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
<script setup>
  import { ref, onMounted, getCurrentInstance} from 'vue'
  import FormHorizontal from '@templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import TemplateEngineBlock from '@templates/template-engine-block'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
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
  })
  const schema = ref({})
  const $route = getCurrentInstance().appContext.config.globalProperties.$route
  const $toast = getCurrentInstance().appContext.config.globalProperties.$toast
  const validationSchema = ref()
  const formTools = ref({})
  const isLoading = ref(true)
  const solutionPayload = ref()
  onMounted(async () => {
    await loadSolution()
  })
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
  const loadTemplate = async() => {
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
  const schemaLoaded = (inputSchema) => {
    schema.value = inputSchema
    const auxValidator = {}
    if (schema.value.fields) {
      schema.value.fields.forEach((element) => {
        auxValidator[element.name] = yup.string()
        if (element.attrs.required) {
          auxValidator[element.name] = auxValidator[element.name].required('This field is required')
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
    const { errors, meta, defineInputBinds, resetForm, values } = useForm({
      validationSchema
    })
    formTools.value = { errors, meta, resetForm, values }
    schema.value.groups[0].fields.forEach((element) => {
      element.value = defineInputBinds(element.name, { validateOnInput: true })
    })
    isLoading.value = false
  }

</script>
