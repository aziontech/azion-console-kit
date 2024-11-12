<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Client" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createClientAccountService"
        :schema="validationSchema"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
      >
        <template #form>
          <FormFieldsCreateClients
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
  import FormFieldsCreateClients from './FormFields/FormFieldsCreateClients.vue'
  import * as yup from 'yup'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    createAccountByTypeService: {
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

  const createClientAccountService = async (data) => {
    return await props.createAccountByTypeService(data, 'client')
  }

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
    postalCode: yup.string().required().label('Postal Code'),

    firstName: yup.string().required().label('First Name'),
    lastName: yup.string().required().label('Last Name'),
    email: yup.string().required().email().label('User Email')
  })

  const handleResponse = () => {
    tracker.product.productCreated({
      productName: 'Clients Account'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Clients Account',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
