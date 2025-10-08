<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    data-testid="network-drawer"
    v-model:visible="showCreateNetworkListDrawer"
    :createService="networkListsService.createNetworkLists"
    :schema="validationSchema"
    :initialValues="initialValues"
    drawerId="network-drawer"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create Network"
    disableToast
  >
    <template #formFields>
      <FormFieldsCreateNetworkLists :listCountriesService="listCountriesService" />
    </template>
  </CreateDrawerBlock>
</template>
<script setup>
  // Vue core
  import { ref, inject } from 'vue'
  // Utilities
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  // Components
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsCreateNetworkLists from '../FormFields/FormFieldsCreateNetworkLists.vue'
  // Services
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { listCountriesService } from '@/services/network-lists-services'

  // Emits & Injections
  const emit = defineEmits(['onSuccess'])
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  // State
  const showCreateNetworkListDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateNetworkListDrawer, DEBOUNCE_TIME_IN_MS)

  // Constants
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

  // Methods - Drawer controls
  const closeCreateDrawer = () => {
    showCreateNetworkListDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateNetworkListDrawer.value = true
  }

  // Methods - UX feedback
  const handleToast = (response) => {
    const toast = { feedback: 'Your Network has been created' }
    response.showToastWithActions(toast)
  }

  // Methods - Tracking
  const handleTrackCreation = () => {
    tracker.product.productCreated({ productName: 'Network List' })
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

  // Methods - Create success
  const handleCreateWithSuccess = (response) => {
    handleTrackCreation()
    handleToast(response)
    emit('onSuccess', response.id)
    closeCreateDrawer()
  }

  // Expose public API
  defineExpose({
    showCreateDrawer,
    showCreateNetworkListDrawer,
    openCreateDrawer
  })
</script>
