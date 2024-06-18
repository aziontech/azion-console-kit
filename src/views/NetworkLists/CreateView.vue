<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Network List"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createNetworkListService"
        :schema="validationSchema"
        :initialValues="initialValues"
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

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsCreateNetworkLists from './FormFields/FormFieldsCreateNetworkLists'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import * as yup from 'yup'
  import { ref } from 'vue'

  const props = defineProps({
    createNetworkListService: {
      type: Function,
      required: true
    },
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
    ipCidr: '',
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
</script>
