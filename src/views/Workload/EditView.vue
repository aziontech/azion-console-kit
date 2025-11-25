<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="workloadName" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="workloadService.editWorkload"
        :loadService="workloadService.loadWorkload"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        @loaded-service-object="setWorkloadName"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <FormFieldsWorkload isEdit />
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
  </ContentBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { validationSchema } from './Config/validation'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()

  defineProps({
    updatedRedirect: { type: String, required: true }
  })

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Workload'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Workload',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const workloadName = ref()

  const setWorkloadName = async (workload) => {
    workloadName.value = workload.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, workload.name)
  }
</script>
