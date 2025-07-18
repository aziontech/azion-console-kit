<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsCreateNetworkLists from './FormFields/FormFieldsCreateNetworkLists'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import * as yup from 'yup'
  import { ref, inject } from 'vue'
  import { networkListsService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listCountriesService: {
      type: Function,
      required: true
    }
  })

  const initialValues = {
    name: '',
    selectedCountries: [],
    networkListType: 'asn',
    asn: '',
    ipCidr: ''
  }

  const options = ref([
    { name: 'ASN', value: 'asn' },
    { name: 'Countries', value: 'countries' },
    { name: 'IP/CIDR', value: 'ip_cidr' }
  ])

  const handleTrackCreation = (response) => {
    tracker.product.productCreated({
      productName: 'Network List'
    })
    handleToast(response)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Network List',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    networkListType: yup.string().oneOf(options.value.map((option) => option.value)),
    selectedCountries: yup.array().when('networkListType', {
      is: 'countries',
      then: (schema) =>
        schema.required('Countries is a required field').min(1, 'Select at least one country')
    }),
    ipCidr: yup.string().when('networkListType', {
      is: 'ip_cidr',
      then: (schema) => schema.required('IP/CIDR is a required field')
    }),
    asn: yup.string().when('networkListType', {
      is: 'asn',
      then: (schema) => schema.required('ASN is a required field')
    })
  })

  const handleToast = (response) => {
    const toast = {
      feedback: 'Your network list has been created',
      actions: {
        link: {
          label: 'View Network List',
          callback: () => response.redirectToUrl(`/network-lists/edit/${response.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Network List"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="networkListsService.createNetworkLists"
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableToast
      >
        <template #form>
          <FormFieldsCreateNetworkLists :listCountriesService="props.listCountriesService" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
