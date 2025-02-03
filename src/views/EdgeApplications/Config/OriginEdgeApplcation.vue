<template>
  <FormAccordion
    @on-response="handleResponse"
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createOriginServices"
    disabledCallback
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
  import { useRoute } from 'vue-router'

  const props = defineProps({
    createOriginService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['createdOrigin'])

  const route = useRoute()
  const edgeApplicationId = ref(route.params.id)

  const validationSchema = yup.object({
    addresses: yup.array().of(
      yup.object({
        address: yup.string().required().label('Address')
      })
    ),
    hostHeader: yup.string().required().label('Host Header')
  })

  const initialValues = ref({
    name: 'Default Origin',
    originType: 'single_origin',
    address: '',
    addresses: [
      {
        address: '',
        serverRole: 'primary',
        isActive: true,
        weight: null
      }
    ],
    originProtocolPolicy: 'preserve',
    hostHeader: '${host}',
    originPath: '',
    hmacAuthentication: false,
    hmacRegionName: '',
    hmacAccessKey: '',
    hmacSecretKey: '',
    connectionTimeout: 60,
    timeoutBetweenBytes: 120
  })

  const createOriginServices = async (payload) => {
    const bodyRequest = {
      id: edgeApplicationId.value,
      ...payload
    }
    return props.createOriginService(bodyRequest)
  }

  const handleResponse = () => {
    emit('createdOrigin')
  }
</script>
