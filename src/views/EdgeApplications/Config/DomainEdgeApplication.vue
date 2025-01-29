<template>
  <FormAccordion
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createDomainsServices"
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

  defineProps({
    listDomainsService: {
      type: Function,
      required: true
    },
    loadDomainsService: {
      type: Function,
      required: true
    }
  })

  const createDomainsServices = (values) => {
    return values
  }
</script>
