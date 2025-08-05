<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditNetworkLists from './FormFields/FormFieldsEditNetworkLists'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { ref, inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { networkListsService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listCountriesService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })
  const options = ref([
    { name: 'ASN', value: 'asn' },
    { name: 'Countries', value: 'countries' },
    { name: 'IP/CIDR', value: 'ip_cidr' }
  ])
  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    networkListType: yup.string().oneOf(options.value.map((option) => option.value)),
    itemsValues: yup
      .string()
      .when('networkListType', {
        is: 'asn',
        then: (schema) => schema.required('ASN is a required field')
      })
      .when('networkListType', {
        is: 'ip_cidr',
        then: (schema) => schema.required('IP/CIDR is a required field')
      })
      .when('networkListType', {
        is: (networkListType) => networkListType !== 'countries',
        then: (schema) =>
          schema.test(
            'no-empty-lines',
            'There must be no empty lines or lines with only whitespace',
            (value) => {
              if (typeof value !== 'string' || !value) {
                return true
              }
              return value.split('\n').every((line) => line.trim() !== '')
            }
          )
      }),
    itemsValuesCountry: yup.array().when('networkListType', {
      is: 'countries',
      then: (schema) =>
        schema.required('Countries is a required field').min(1, 'Select at least one country')
    })
  })

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
      <PageHeadingBlock pageTitle="Network Lists"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="networkListsService.editNetworkList"
        :loadService="networkListsService.loadNetworkList"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsEditNetworkLists :listCountriesService="props.listCountriesService" />
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
