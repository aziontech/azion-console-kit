<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="connectorName"
        description="Configure addresses, protocols, and traffic distribution used to connect to origins and external services."
      ></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="edgeConnectorsService.editEdgeConnectorsService"
        :loadService="edgeConnectorsService.loadEdgeConnectorsService"
        :schema="validationSchema"
        @loaded-service-object="setConnectorName"
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
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEdgeConnectors from './FormFields/FormFieldsEdgeConnectors.vue'
  import { validationSchema } from './Config/validation'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const connectorName = ref('Edit Connector')

  const setConnectorName = (connector) => {
    connectorName.value = connector.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, connector.name)
  }
</script>
