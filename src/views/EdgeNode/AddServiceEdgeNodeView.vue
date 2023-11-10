<template>
  <CreateFormBlock
    pageTitle="Add Service"
    :createService="addServiceEdgeNode"
    :formData="values"
    :formMeta="meta"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <FormHorizontal
        title="Service"
        description=""
      >
        <template #inputs>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col w-full sm:max-w-xs gap-2">
              <label
                for="id"
                class="text-color text-base font-medium"
                >Service</label
              >
              <Dropdown
                v-model="serviceId"
                :options="services"
                placeholder="Service"
                optionLabel="name"
                optionValue="serviceId"
                class="!w-full"
                :disabled="!services.length"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label>Variables: </label>
              <vue-monaco-editor
                v-model:value="variables"
                language="javascript"
                theme="vs-dark"
                class="min-h-[50vh]"
                :options="editorOptions"
              />
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>
<script>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import Dropdown from 'primevue/dropdown'

  export default {
    name: 'add-service',
    components: {
      Dropdown,
      CreateFormBlock,
      FormHorizontal
    },
    props: {
      addEdgeNodeService: {
        type: Function,
        required: true
      },
      listServiceEdgeNodeService: {
        type: Function,
        required: true
      }
    },
    data: () => {
      const editorOptions = {
        minimap: {
          enabled: false
        },
        readOnly: false,
        scrollBeyondLastLine: false
      }
      yup.addMethod(yup.string, 'validateValue', function () {
        return this.test({
          name: 'variables',
          exclusive: true,
          message: 'Invalid value',
          test: (value) => {
            if (value) {
              const split = value.split(/\s*\n+\s*/).filter((row) => !!row)
              return split.every((row) => /^\w+\s*=[^"]+$/.test(row))
            }
            return true
          }
        })
      })

      const validationSchema = yup.object({
        services: yup.array(),
        serviceId: yup.string().required(),
        variables: yup.string().validateValue()
      })
      const ARGS_INITIAL_STATE = ''
      const { errors, meta, values, resetForm, setValues } = useForm({
        validationSchema,
        initialValues: {
          services: [],
          serviceId: '',
          variables: ARGS_INITIAL_STATE
        }
      })

      const { value: services } = useField('services')
      const { value: serviceId } = useField('serviceId')
      const { value: variables } = useField('variables')

      return {
        errors,
        meta,
        values,
        services,
        serviceId,
        variables,
        setValues,
        editorOptions,
        resetForm
      }
    },
    async created() {
      this.edgeNodeId = this.$route.params.id
      await this.listServicesEdgeNode()
    },
    methods: {
      async listServicesEdgeNode() {
        const result = await this.listServiceEdgeNodeService({ id: this.edgeNodeId, bound: false })
        this.services.push(...result)
      },

      async addServiceEdgeNode(payload) {
        await this.addEdgeNodeService(this.edgeNodeId, payload)
      }
    }
  }
</script>
