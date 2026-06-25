<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditNetworkLists from './FormFields/FormFieldsEditNetworkLists'
  import FormSkeleton from './components/FormSkeleton.vue'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import { validationSchema } from './Config/validation'
  import { ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const networkListName = ref('Network List')
  const isFormLoading = ref(true)

  const cachedNetworkList = networkListsService.getNetworkListFromCache(route.params?.id) ?? {}

  const props = defineProps({
    listCountriesService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const setNetworkListName = (networkList) => {
    networkListName.value = networkList.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, networkList.name)
    isFormLoading.value = false
  }
  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Network List'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Network List',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="networkListName"
        description="Configure IP addresses and ranges used by security rules."
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="networkListsService.editNetworkList"
        :loadService="networkListsService.loadNetworkList"
        :initialValues="cachedNetworkList"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
        @loaded-service-object="setNetworkListName"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
      >
        <template #form="{ loading }">
          <FormSkeleton v-if="isFormLoading" />
          <FormFieldsEditNetworkLists
            v-else
            :listCountriesService="props.listCountriesService"
            :loading="loading"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            v-if="!isFormLoading"
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
