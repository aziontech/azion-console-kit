<template>
  <EditFormBlock
    :editService="workloadService.editWorkload"
    :loadService="workloadService.loadWorkload"
    :schema="validationSchema"
    :updatedRedirect="updatedRedirect"
    :initialValues="cachedWorkload"
    :isTabs="embeddedInTabs"
    @loaded-service-object="(workload) => $emit('loaded-service-object', workload)"
    @on-edit-success="handleTrackEditEvent"
    @on-edit-fail="handleTrackFailEditEvent"
  >
    <template #form="{ loading }">
      <div class="relative flex flex-col gap-8 max-md:gap-6">
        <FormFieldsWorkload isEdit />
        <div
          v-if="loading"
          class="absolute inset-0 z-10 bg-[var(--surface-ground)]"
        >
          <FormSkeleton />
        </div>
      </div>
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
  import { inject } from 'vue'
  import { useRoute } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import FormSkeleton from './components/FormSkeleton.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { validationSchema } from './Config/validation'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()

  defineProps({
    updatedRedirect: { type: String, required: true },
    embeddedInTabs: { type: Boolean, default: false }
  })

  defineEmits(['loaded-service-object'])

  const cachedWorkload = workloadService.getWorkloadFromCache(route.params.id) ?? {}

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
</script>
