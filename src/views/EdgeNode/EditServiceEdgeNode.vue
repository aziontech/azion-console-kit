<template>
  <EditFormBlock
    pageTitle="Edit Edge Node"
    :editService="this.editServiceEdgeNode"
    :loadService="this.loadServicesEdgeNode"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
    backURL="/edge-node"
  >
    <template #form>
      <InputText
        placeholder="Service name"
        v-model="serviceName"
        type="text"
        :disabled="true"
      />
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
    </template>
  </EditFormBlock>
</template>
<script>
  import EditFormBlock from '@/templates/edit-form-block'
  import InputText from 'primevue/inputtext'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    name: 'edit-service',
    components: {
      InputText,
      EditFormBlock
    },
    props: {
      editService: {
        type: Function,
        required: true
      },
      loadService: {
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
        serviceName: yup.string(),
        variables: yup.string().validateValue()
      })
      const ARGS_INITIAL_STATE = ''
      const { errors, meta, values, resetForm, setValues } = useForm({
        validationSchema,
        initialValues: {
          serviceName: '',
          variables: ARGS_INITIAL_STATE
        }
      })

      const { value: serviceName } = useField('serviceName')
      const { value: variables } = useField('variables')

      return {
        errors,
        meta,
        values,
        serviceName,
        variables,
        setValues,
        editorOptions,
        resetForm
      }
    },
    async created() {
      const parts = this.$route.path.split('/')
      this.edgeNodeId = parts[3]
    },
    methods: {
      async loadServicesEdgeNode(id) {
        return await this.loadService({ edgeNodeId: this.edgeNodeId, ...id })
      },

      async editServiceEdgeNode(payload) {
        await this.editService(this.edgeNodeId, payload)
      }
    }
  }
</script>
