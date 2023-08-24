<template>
  <CreateFormBlock
    :pageTitle="'Create Network Lists'"
    :createService="props.createNetworkListService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="flex flex-col gap-2">
        <label for="name">Name:</label>
        <InputText
          placeholder="Add Network List Name"
          v-bind="name"
          id="name"
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="errors.name"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="type">Type: </label>
        <Dropdown
          v-model="value"
          :options="options"
          optionLabel="name"
          id="type"
          optionValue="value"
          placeholder="Select a City"
          class="w-full md:w-14rem"
        />
      </div>
      <div class="flex flex-col gap-2" v-if="value === 'asn'">
        <label for="list">List: </label>
        <div class="card flex justify-content-center">
          <Textarea v-bind="asn" rows="5" cols="75" id="list" placeholder="1234&#10;4321" />
        </div>
      </div>
      <div class="flex flex-col gap-2" v-if="value === 'ip_cidr'">
        <label for="list">List: </label>
        <div class="card flex justify-content-center">
          <Textarea
            v-model="ipCidr"
            rows="5"
            id="list"
            cols="75"
            placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2" v-if="value === 'ip_cidr'">
        <label for="list">Countries: </label>
        <div class="card flex justify-content-center">
          <MultiSelect
            v-model="countries"
            :options="cities"
            filter
            optionLabel="name"
            placeholder="Select Cities"
            :maxSelectedLabels="3"
            class="w-full md:w-20rem"
          />
        </div>
      </div>
    </template>
  </CreateFormBlock>
</template>

<script setup>
import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

import CreateFormBlock from '@/templates/create-form-block'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'

const options = ref([
  { name: 'ASN', value: 'asn' },
  { name: 'Croutries', value: 'countries' },
  { name: 'IP/CIDR', value: 'ip_cidr' }
])

const props = defineProps({
  createNetworkListService: {
    type: Function,
    required: true
  },
  listContriesService: {
    type: Function,
    required: true
  }
})

const validationSchema = yup.object({
  name: yup.string().required(),
  ipCidr: yup.string(),
  asn: yup.string(),
  countries: yup.string()
})

const { errors, defineInputBinds, meta, resetForm, values } = useForm({
  validationSchema,
  initialValues: {
    listType: 'asn'
  }
})

const { value } = useField('listType')

const name = defineInputBinds('name', { validateOnInput: true })
const ipCidr = defineInputBinds('ipCidr', { validateOnInput: true })
const asn = defineInputBinds('asn', { validateOnInput: true })
const countries = defineInputBinds('countries', { validateOnInput: true })

</script>
