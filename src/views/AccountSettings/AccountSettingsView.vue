<script setup>
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import * as yup from 'yup'
  import FormFieldsAccountSettings from './FormFields/FormFieldsAccountSettings'
  import { inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    getAccountSettingsService: {
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
    },
    updateAccountSettingsService: {
      type: Function,
      required: true
    }
  })

  const router = useRouter()

  const userWasInPayments = ref(false)

  onMounted(() => {
    userWasInPayments.value = Boolean(router.currentRoute.value.query?.payment) || false
  })

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Account Settings'
      })
      .track()
  }

  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Account Settings',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const validationSchema = yup.object({
    accountName: yup.string().required().label('Account Name'),
    clientId: yup.string(),
    companyName: yup.string(),
    uniqueIdentifier: yup.string(),
    billingEmails: yup.string(),
    postalCode: yup.string().required().label('Postal Code'),
    country: yup.string().required().label('Country'),
    region: yup.string().required().label('State/Region'),
    city: yup.string().required().label('City'),
    address: yup.string().required().label('Address'),
    complement: yup.string(),
    isSocialLoginEnabled: yup.boolean(),
    isEnabledMfaToAllUsers: yup.boolean()
  })

  const redirectUserOnSuccessEdit = async () => {
    if (userWasInPayments.value) {
      router.push({ path: '/billing/payment', query: { payment: true } })
      await loadUserAndAccountInfo()
    } else {
      router.push({ path: '/' })
    }
  }

  const handleActionsSuccessEdit = async () => {
    handleTrackSuccessEdit()
    await redirectUserOnSuccessEdit()
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Account Settings" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="updateAccountSettingsService"
        :loadService="getAccountSettingsService"
        @on-edit-success="handleActionsSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
        disableRedirect
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsAccountSettings
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
