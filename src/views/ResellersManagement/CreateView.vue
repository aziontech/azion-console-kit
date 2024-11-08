<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Reseller" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createResellerAccountService"
        :schema="validationSchema"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
      >
        <template #form>
          <FormFieldsCreateResellers
            :listCountriesService="listCountriesService"
            :listRegionsService="listRegionsService"
            :listCitiesService="listCitiesService"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCreateResellers from './FormFields/FormFieldsCreateResellers.vue'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
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
    },
    createResellerAccountService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    accountName: yup.string().required().label('Account Name'),
    companyName: yup.string().required().label('Company Name'),
    uniqueIdentifier: yup.string().label('Unique Identifier'),
    active: yup.boolean().required().default(false),

    country: yup.string().required().label('Country'),
    region: yup.string().required().label('State/Region'),
    city: yup.string().required().label('City'),
    address: yup.string().required().label('Address'),
    complement: yup.string(),
    postalCode: yup.string().required().label('Postal Code')
  })

  const handleResponse = () => {
    tracker.product.productCreated({
      productName: 'Resellers'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Resellers',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
