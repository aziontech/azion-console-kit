<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Custom Page" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="customPageService.editCustomPagesService"
        :loadService="customPageService.loadCustomPagesService"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
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
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCustomPages from './FormFields/FormFieldsCustomPages'
  import { customPageService } from '@/services/v2'

  defineProps({
    loadCustomPagesService: {
      type: Function,
      required: true
    },
    editCustomPagesService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    listEdgeConnectorsService: {
      type: Function,
      required: true
    },
    loadEdgeConnectorsService: {
      type: Function,
      required: true
    }
  })

  defineOptions({
    name: 'edit-custom-pages'
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
</script>
