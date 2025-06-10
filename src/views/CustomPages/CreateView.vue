<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Custom Page" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="customPageService.createCustomPagesService"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleToast"
        disableToast
      >
        <template #form>
          <FormFieldsCustomPages
            :listEdgeConnectorsService="listEdgeConnectorsService"
            :loadEdgeConnectorsService="loadEdgeConnectorsService"
          />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import * as yup from 'yup'
  import { ref } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCustomPages from './FormFields/FormFieldsCustomPages'
  import { customPageService } from '@/services/v2'

  defineProps({
    listEdgeConnectorsService: {
      type: Function,
      required: true
    },
    loadEdgeConnectorsService: {
      type: Function,
      required: true
    }
  })

  const initialValues = ref({
    name: '',
    isActive: false,
    isDefault: false,
    edgeConnectorId: null,
    pages: []
  })

  defineOptions({
    name: 'create-custom-pages'
  })

  const isUriValidRegex = /^\/[/a-zA-Z0-9\-_.~@:]*$/

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    isActive: yup.boolean().required().label('Active'),
    isDefault: yup.boolean().required().label('Default'),
    edgeConnectorId: yup.string().nullable().label('Edge Connector'),
    pages: yup
      .array()
      .of(
        yup.object().shape({
          code: yup.string().required().label('Code'),
          ttl: yup.number().min(1).required().label('TTL'),
          uri: yup
            .string()
            .transform((value) => (value === '' ? null : value))
            .nullable()
            .matches(isUriValidRegex, 'Invalid URI')
            .label('URI'),
          custom_status_code: yup.number().label('Custom Status Code')
        })
      )
      .required()
      .label('Pages')
  })

  const handleToast = (response) => {
    const toast = {
      feedback: 'Custom Page successfully created',
      actions: {
        link: {
          label: 'View Custom Page',
          callback: () => response.redirectToUrl(`/custom-pages/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>
