<script setup>
  import { ref, computed, watch } from 'vue'
  import { useRoute } from 'vue-router'

  // Import the components
  import FormFieldsDataStream from '@/views/DataStream/FormFields/FormFieldsDataStream'
  import FormSkeleton from '@/views/DataStream/components/FormSkeleton.vue'
  import SamplingDialog from '@/views/DataStream/Dialog/SamplingDialog'
  import { validationSchema } from '@/views/DataStream/FormFields/composables/validation'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import { useAccountStore } from '@/stores/account'
  import { dataStreamService } from '@/services/v2/data-stream/data-stream-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  const props = defineProps({
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const validation = validationSchema(true)
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const store = useAccountStore()

  const displaySamplingDialog = ref(false)
  const isFormLoading = ref(true)
  const streamName = computed(() => cachedDataStream.value?.name || 'Edit Stream')
  const cachedDataStream = computed(() =>
    dataStreamService.getDataStreamFromCache(route.params?.id)
  )

  const hasNoPermissionToEditDataStream = computed(() => store.hasPermissionToEditDataStream)

  const setStreamName = (dataStream) => {
    isFormLoading.value = false
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, dataStream.name)
  }

  const formSubmit = (onSubmit, values, formValid) => {
    if (!values.hasSampling) {
      onSubmit()
    } else {
      if (!formValid) {
        onSubmit()
        return
      }

      displaySamplingDialog.value = true
    }
  }

  watch(cachedDataStream, () => {
    if (cachedDataStream.value?.name) {
      breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedDataStream.value?.name)
    }
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="streamName"
        description="Configure data sources, delivery destinations, and delivery behavior for event and log data."
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="dataStreamService.editDataStreamService"
        :loadService="dataStreamService.loadDataStreamService"
        :updatedRedirect="props.updatedRedirect"
        :initialValues="cachedDataStream"
        :schema="validation"
        @loaded-service-object="setStreamName"
      >
        <template #form="{ loading }">
          <FormSkeleton v-if="loading" />
          <FormFieldsDataStream
            v-else
            isEdit
          />
        </template>
        <template
          v-if="hasNoPermissionToEditDataStream && !isFormLoading"
          #action-bar="{ onSubmit, onCancel, loading, values, formValid }"
        >
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit, values, formValid)"
            @onCancel="onCancel"
            :loading="loading"
          />
          <SamplingDialog
            data-testid="data-stream-form__sampling__dialog"
            v-model:visible="displaySamplingDialog"
            @confirm="onSubmit"
            @cancel="displaySamplingDialog = false"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
