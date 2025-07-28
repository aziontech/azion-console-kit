<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Connectors"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="edgeConnectorsService.editEdgeConnectorsService"
        :loadService="edgeConnectorsService.loadEdgeConnectorsService"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsEdgeConnectors
            :schema="validationSchema"
            :resetForm="resetForm"
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
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEdgeConnectors from './FormFields/FormFieldsEdgeConnectors.vue'
  import { validationSchema } from './Config/validation'
  import { edgeConnectorsService } from '@/services/v2'
</script>
