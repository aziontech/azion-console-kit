<template>
  <CreateFormBlock
    pageTitle="Add Service"
    :createService="addService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="flex flex-col gap-2">
        <label for="name">Service: </label>
        <Dropdown
          v-model="serviceId"
          :options="services"
          optionLabel="name"
          optionValue="serviceId"
          class="!w-full"
          :disabled="!services.length"
        />
      </div>
    </template>
  </CreateFormBlock>
</template>
<script>
  import CreateFormBlock from '@/templates/create-form-block'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import Dropdown from 'primevue/dropdown'

  export default {
    name: 'add-service',
    components: {
      Dropdown,
      CreateFormBlock
    },
    props: {
      addService: {
        type: Function,
        required: true
      },
      listService: {
        type: Function,
        required: true
      }
    },
    data: () => {
      const validationSchema = yup.object({
        services: yup.array(),
        serviceId: yup.string().required(),
        variables: yup.array()
      })

      const { errors, defineInputBinds, meta, values, setValues } = useForm({
        validationSchema,
        initialValues: {
          services: [],
          serviceId: ''
        }
      })

      const { value: services } = useField('services')
      const { value: serviceId } = useField('serviceId')
      const variables = defineInputBinds('variables')

      return {
        errors,
        meta,
        values,
        services,
        serviceId,
        variables,
        setValues
      }
    },
    async created() {
      this.edgeNodeId = this.$route.params.id
      await this.listServicesEdgeNode()
    },
    methods: {
      async listServicesEdgeNode() {
        const result = await this.listService({ id: this.edgeNodeId, bound: false })
        this.services.push(...result)
        console.log(this.services)
      }
    }
  }
</script>
