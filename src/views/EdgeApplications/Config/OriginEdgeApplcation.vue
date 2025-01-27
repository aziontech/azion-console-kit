<template>
  <FormAccordion
    @on-response="handleResponse"
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createOriginServices"
    >
    <template #form>
      <FormFieldsOrigin></FormFieldsOrigin>
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
  import FormFieldsOrigin from '../FormFields/FormFieldsCreateOrigin.vue'
  import * as yup from 'yup'
  import { ref } from 'vue'

  const validationSchema = yup.object({
    address: yup.string().required().label('Address'),
    hostHeader: yup.string().required().label('Host Header')
  })

  const initialValues = ref({
    originType: 'single_origin',
    address: '',
    originProtocolPolicy: 'preserve',
    hostHeader: '${host}'
  })

  const createOriginServices = async (values) => {
    return values
  }

  const handleResponse = () => {}
</script>
