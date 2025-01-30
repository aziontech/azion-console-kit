<template>
  <FormAccordion
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createDomainsServices"
    disabledCallback
  >
    <template #form>
      <FormFieldsCreateDomain
        :listDomainsService="listDomainsService"
        :loadDomainsService="loadDomainsService"
      ></FormFieldsCreateDomain>
    </template>
    <template #action-bar-accordion="{ onSubmit, loading }">
      <ActionBarAccordion
        @onSubmit="onSubmit"
        :loading="loading"
        data-testid="create-edge-application-action-bar"
      />
    </template>
  </FormAccordion>
</template>
<script setup>
  import ActionBarAccordion from '@/templates/action-bar-block/action-bar-accordion.vue'
  import FormAccordion from '@/templates/create-form-block/form-accordion.vue'
  import FormFieldsCreateDomain from '../FormFields/FormFieldsCreateDomain.vue'
  import { useRoute } from 'vue-router'
  import { ref } from 'vue'

  const props = defineProps({
    listDomainsService: {
      type: Function,
      required: true
    },
    loadDomainsService: {
      type: Function,
      required: true
    },
    listWorkloadDeploymentService: {
      type: Function,
      required: true
    },
    editWorkloadDeploymentService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const edgeApplicationId = ref(route.params.id)

  const handlerWorkloadDeployment = async (domain) => {
    const worloads = await props.listWorkloadDeploymentService({ id: domain, all: true })
    worloads.push({
      edgeApplicationId: edgeApplicationId.value,
      edgeFirewall: null
    })

    return props.editWorkloadDeploymentService({ domainId: domain, payload: worloads, all: true })
  }

  const createDomainsServices = async (values) => {
    return handlerWorkloadDeployment(values.domain)
  }
</script>
