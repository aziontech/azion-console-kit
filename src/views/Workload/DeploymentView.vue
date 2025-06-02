<template>
  <EditFormBlock
    :editService="editWorkLoadDeployment"
    :loadService="listWorkloadDeployment"
    :schema="validationSchema"
    :updatedRedirect="updatedRedirect"
    @loaded-service-object="setDomainName"
    @on-edit-success="handleTrackEditEvent"
    @on-edit-fail="handleTrackFailEditEvent"
    isTabs
  >
    <template #form>
      <FormFieldsEditWorkload
        :listEdgeApplicationsService="listEdgeApplicationsService"
        :loadEdgeApplicationsService="loadEdgeApplicationsService"
        :listEdgeFirewallService="edgeFirewallService.listEdgeFirewallService"
        :loadEdgeFirewallService="edgeFirewallService.loadEdgeFirewallService"
        :listCustomPagesService="listCustomPagesService"
        :loadCustomPagesService="loadCustomPagesService"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel, loading }">
      <ActionBarTemplate
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditWorkload from './FormFields/FormFieldsEditWorkload.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { useRoute } from 'vue-router'
  import { edgeFirewallService } from '@/services/v2'

  const props = defineProps({
    editWorkloadDeploymentService: {
      type: Function,
      required: true
    },
    listWorkloadDeployment: {
      type: Function,
      required: true
    },
    listEdgeApplicationsService: {
      type: Function,
      required: true
    },
    loadEdgeApplicationsService: {
      type: Function,
      required: true
    },
    listEdgeFirewallService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallService: {
      type: Function,
      required: true
    },
    listCustomPagesService: {
      type: Function,
      required: true
    },
    loadCustomPagesService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const route = useRoute()

  const validationSchema = yup.object({
    id: yup.string().required(),
    edgeApplication: yup.number().required().label('Edge Application'),
    edgeFirewall: yup.mixed().oneOf[(yup.number(), null)],
    customPage: yup.mixed().oneOf[(yup.number(), null)]
  })

  const editWorkLoadDeployment = async (payload) => {
    const domainId = route.params.id
    return await props.editWorkloadDeploymentService({ domainId, payload })
  }
</script>
