<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { ref } from 'vue'
  import FormFieldsCreateNetworkLists from '../FormFields/FormFieldsCreateNetworkLists.vue'
  import { createNetworkListService } from '@/services/network-lists-services'
  import { listCountriesService } from '@/services/network-lists-services'

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */

  defineOptions({
    name: 'network-lists-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  const showCreateNetworkListsDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300

  const showCreateDrawer = refDebounced(showCreateNetworkListsDrawer, DEBOUNCE_TIME_IN_MS)

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
      then: (schema) => schema.required('Countries is a required field').min(1)
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

  const closeCreateDrawer = () => {
    showCreateNetworkListsDrawer.value = false
  }

  const openCreateDrawer = () => {
    showCreateNetworkListsDrawer.value = true
  }

  const handleCreateWithSuccess = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateNetworkListsDrawer"
    :createService="createNetworkListService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    title="Create Network List"
  >
    <template #formFields>
      <FormFieldsCreateNetworkLists
        :isDrawer="true"
        :listCountriesService="listCountriesService"
      />
    </template>
  </CreateDrawerBlock>
</template>
