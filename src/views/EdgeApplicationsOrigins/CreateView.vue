<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Origins"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createOriginWithEdgeApplicationIdDecorator"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsCreateEdgeApplicationsOrigins />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCreateEdgeApplicationsOrigins from './FormFields/FormFieldsCreateEdgeApplicationsOrigins'
  import { ref } from 'vue'
  import * as yup from 'yup'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useRoute } from 'vue-router'
  const route = useRoute()

  const props = defineProps({
    createOriginService: {
      type: Function,
      required: true
    }
  })

  async function createOriginWithEdgeApplicationIdDecorator(formValues) {
    const { id } = route.params
    return await props.createOriginService(formValues, id)
  }

  const validationSchema = yup.object({
    name: yup.string().required(),
    addresses: yup.array().of(
      yup.object().shape({
        address: yup.string().required(),
        isActive: yup.boolean()
      })
    )
  })

  const initialValues = ref({
    name: '',
    hostHeader: '${host}',
    method: 'ip_hash',
    originPath: '',
    addresses: [
      {
        address: '',
        weight: 1,
        serverRole: 'primary',
        isActive: true
      }
    ],
    originProtocolPolicy: 'preserve',
    originType: 'load_balancer',
    key: '',
    hmacAuthentication: false,
    hmacRegionName: '',
    hmacAccessKey: '',
    hmacSecretKey: '',
    connectionTimeout: 60,
    timeoutBetweenBytes: 120
  })
</script>
