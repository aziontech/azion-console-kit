<template>
  <EditFormBlock
    :editService="editWorkload"
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
    <template #action-bar="{ onCancel }">
      <Teleport
        to="#action-bar"
        v-if="isMounted"
      >
        <ActionBarBlock>
          <PrimeButton
            outlined
            type="button"
            label="Cancel"
            class="max-md:min-w-max"
            data-testid="workload-settings__cancel"
            @click="onCancel"
          />
          <PrimeButton
            outlined
            type="button"
            label="Save as Draft"
            data-testid="workload-settings__save-draft"
          />
          <PrimeButton
            type="button"
            label="Save and Deploy"
            data-testid="workload-settings__save-deploy"
          />
        </ActionBarBlock>
      </Teleport>
    </template>
  </EditFormBlock>
</template>

<script setup>
  import { inject, ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import FormSkeleton from './components/FormSkeleton.vue'
  import ActionBarBlock from '@/templates/action-bar-block'
  import PrimeButton from '@aziontech/webkit/button'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { buildValidationSchema } from './Config/validation'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()

  // Teleport target (#action-bar) lives in the page shell (content-block); only
  // teleport once it exists after mount, mirroring action-bar-with-teleport.
  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })

  defineProps({
    updatedRedirect: { type: String, required: true },
    embeddedInTabs: { type: Boolean, default: false }
  })

  defineEmits(['loaded-service-object'])

  const cachedWorkload = workloadService.getWorkloadFromCache(route.params.id) ?? {}
  const validationSchema = buildValidationSchema(true)

  const editWorkload = (payload) => workloadService.editWorkload(payload, true)

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
