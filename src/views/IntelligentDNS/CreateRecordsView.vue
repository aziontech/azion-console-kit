<template>
  <CreateFormBlock
    :pageTitle="'Create Intelligent DNS Records'"
    :createService="props.createRecordsService"
    :formData="formValues"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="flex items-end gap-2">
        <InputText
          placeholder="Name"
          v-bind="name"
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="errors.name"
        />
        <label for="youdomain">.{{ intelligentDNSStore.domain.value }}</label>
      </div>

      <div class="card flex justify-content-center">
        <Dropdown
          v-model="selectedRecordType"
          :options="recordsTypes"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a Record Type"
          :class="{ 'p-invalid': errors.type }"
          class="w-full md:w-14rem"
        />
      </div>
      <Textarea
        rows="5"
        cols="30"
        placeholder="Value"
        v-bind="value"
        type="text"
        :class="{ 'p-invalid': errors.value }"
        v-tooltip.top="errors.value"
      />
      <InputText
        placeholder="TTL (seconds):"
        v-bind="ttl"
        type="number"
        :class="{ 'p-invalid': errors.ttl }"
        v-tooltip.top="errors.ttl"
      />
      <div class="card flex justify-content-center">
        <Dropdown
          v-model="selectedPolicy"
          :options="policyList"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a Policy"
          :class="{ 'p-invalid': errors.selectedPolicy }"
          class="w-full md:w-14rem"
        />
      </div>
      <InputText
        placeholder="Weight:"
        v-bind="weight"
        type="text"
        :class="{ 'p-invalid': errors.weight }"
        v-tooltip.top="errors.weight"
        v-if="isWeightedPolicy"
      />
      <InputText
        placeholder="Description:"
        v-bind="description"
        type="text"
        :class="{ 'p-invalid': errors.description }"
        v-tooltip.top="errors.description"
        v-if="isWeightedPolicy"
      />
    </template>
  </CreateFormBlock>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useIntelligentDNSStore } from '@/stores/intelligent-dns'
import CreateFormBlock from '@/templates/create-form-block'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import { useForm } from 'vee-validate'
import * as yup from 'yup'

const props = defineProps({
  createRecordsService: {
    type: Function,
    required: true
  }
})

const route = useRoute()
const intelligentDNSStore = useIntelligentDNSStore()

const recordsTypes = ref([
  { label: 'A - IPv4 Address', value: 'A' },
  { label: 'AAAA - IPv6 Address', value: 'AAAA' },
  { label: 'ANAME - Maps a name to another name', value: 'ANAME' },
  { label: 'CAA - Certification Authority Authorization', value: 'CAA' },
  { label: 'CNAME - Canonical name', value: 'CNAME' },
  { label: 'DS - Delegation Signer', value: 'DS' },
  { label: 'MX - Mail exchange', value: 'MX' },
  { label: 'NS - Name Servers', value: 'NS' },
  { label: 'PTR - Reverse DNS lookup', value: 'PTR' },
  { label: 'SRV - Location of server or service', value: 'SRV' },
  { label: 'TXT - Text', value: 'TXT' }
])

const policyList = ref([
  { label: 'Simple', value: 'simple' },
  { label: 'Weighted', value: 'weighted' }
])

//Validation Schema
const validationSchema = yup.object({
  name: yup.string().required(),
  selectedRecordType: yup.string().required('Please select an option'),
  value: yup.string().required(),
  ttl: yup.number().required(),
  selectedPolicy: yup.string().required('Please select an option'),
  weight: yup.number().required(),
  description: yup.string()
})

// validation with VeeValidate
const { errors, defineInputBinds, meta, resetForm, values } = useForm({
  validationSchema,
  initialValues: {
    intelligentDNSID: route.params.id,
    selectedRecordType: 'A',
    ttl: 3600,
    selectedPolicy: 'simple',
    weight: '100'
  }
})

const name = defineInputBinds('name', { validateOnInput: true })
const selectedRecordType = ref(values.selectedRecordType)
const value = defineInputBinds('value', { validateOnInput: true })
const ttl = defineInputBinds('ttl', { validateOnInput: true })
const selectedPolicy = ref(values.selectedPolicy)
const weight = defineInputBinds('weight', { validateOnInput: true })
const description = defineInputBinds('description', { validateOnInput: true })

let formValues = { ...values, selectedRecordType, selectedPolicy }
let isWeightedPolicy = false

watch([selectedRecordType, selectedPolicy, values], () => {
  formValues = { ...values, selectedRecordType, selectedPolicy }
  isWeightedPolicy = selectedPolicy.value === 'weighted'
})
</script>
