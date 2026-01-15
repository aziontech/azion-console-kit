<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="resellerName"
        description="Configure a reseller account."
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editAccountService"
        :loadService="props.loadAccountService"
        :schema="validationSchema"
        :updatedRedirect="props.updatedRedirect"
        @loaded-service-object="setResellerName"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
      >
        <template #form>
          <FormFieldsCreateResellers
            :listCountriesService="listCountriesService"
            :listRegionsService="listRegionsService"
            :listCitiesService="listCitiesService"
            isEdit
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarBlockWithTeleport
            v-if="!values.managed"
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
  import FormFieldsCreateResellers from './FormFields/FormFieldsCreateResellers.vue'

  import * as yup from 'yup'
  import { inject, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const resellerName = ref('Edit Reseller')

  const setResellerName = (reseller) => {
    resellerName.value = reseller.name || reseller.company_name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, resellerName.value)
  }

  const props = defineProps({
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

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Resellers'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Resellers',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
