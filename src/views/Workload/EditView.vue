<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="workloadName"
        description="Configure domains, protocols, certificates, and select the security and application settings executed by this Workload."
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="workloadService.editWorkload"
        :loadService="workloadService.loadWorkload"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        :initialValues="cachedWorkload"
        @loaded-service-object="setWorkloadName"
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
  </ContentBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import FormSkeleton from './components/FormSkeleton.vue'
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

  const cachedWorkload = workloadService.getWorkloadFromCache(route.params.id) ?? {}
  const workloadName = ref(cachedWorkload?.name)

  if (cachedWorkload?.name) {
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedWorkload.name)
  }

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

  const setWorkloadName = async (workload) => {
    workloadName.value = workload.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, workload.name)
  }
</script>
