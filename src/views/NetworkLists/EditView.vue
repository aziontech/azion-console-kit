<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Network Lists"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editNetworkListsService"
        :loadService="props.loadNetworkListsService"
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

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditNetworkLists from './FormFields/FormFieldsEditNetworkLists'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  const props = defineProps({
    loadNetworkListsService: { type: Function, required: true },
    editNetworkListsService: { type: Function, required: true },
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
      }),
    itemsValuesCountry: yup.array().when('networkListType', {
      is: 'countries',
      then: (schema) =>
        schema.required('Countries is a required field').min(1, 'Select at least one country')
    })
  })
</script>
