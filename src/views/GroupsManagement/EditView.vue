<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Group"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editAccountService"
        :loadService="loadAccountService"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
      >
        <template #form>
          <FormFieldsCreateGroups
            isEdit
            :listCountriesService="listCountriesService"
            :listRegionsService="listRegionsService"
            :listCitiesService="listCitiesService"
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
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateGroups from './FormFields/FormFieldsCreateGroups.vue'

  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    loadAccountService: {
      type: Function,
      required: true
    },
    editAccountService: {
      type: Function,
      required: true
    },
    listCountriesService: {
      type: Function,
      required: true
    },
    listRegionsService: {
      type: Function,
      required: true
    },
    listCitiesService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    accountName: yup.string().required().label('Account Name'),
    companyName: yup.string().label('Company Name'),
    uniqueIdentifier: yup.string().label('Unique Identifier'),
    billingEmails: yup.string().label('Billing Emails'),
    active: yup.boolean().required().default(false),

    country: yup.string().required().label('Country'),
    region: yup.string().required().label('State/Region'),
    city: yup.string().required().label('City'),
    address: yup.string().required().label('Address'),
    complement: yup.string(),
    postalCode: yup.string().required().label('Postal Code')
  })

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Groups Management'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Groups Management',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
