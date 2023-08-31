<template>
  <CreateFormBlock
    :pageTitle="'Create Network Lists'"
    :createService="createNetworkListService"
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
          :class="{ 'p-invalid': errors.networkListType }"
          v-model="networkListType"
          :options="options"
          optionLabel="name"
          optionValue="value"
          class="w-full md:w-14rem"
        />
      </div>
      <div class="flex flex-col gap-2" v-if="networkListType === 'asn'">
        <label for="list">List: </label>
        <div class="card flex justify-content-center">
          <TextareaComponent
            :class="{ 'p-invalid': errors.ans }"
            v-bind="asn"
            rows="5"
            cols="75"
            id="list"
            placeholder="1234&#10;4321"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2" v-if="networkListType === 'ip_cidr'">
        <label for="list">List: </label>
        <div class="card flex justify-content-center">
          <TextareaComponent
            :class="{ 'p-invalid': errors.ipCidr }"
            v-bind="ipCidr"
            rows="5"
            id="ipCidr"
            cols="75"
            placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2" v-if="networkListType === 'countries'">
        <label for="list">Countries: </label>
        <div class="card flex justify-content-center">
          <MultiSelect
            v-model="selectedCountries"
            :options="countriesList"
            filter
            optionLabel="name"
            optionValue="value"
            placeholder="Select Countries"
            :class="{ 'p-invalid': errors.selectedCountries }"
            class="w-full"
          />
        </div>
      </div>
    </template>
  </CreateFormBlock>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

import CreateFormBlock from '@/templates/create-form-block'
import TextareaComponent from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'

export default {
  components: {
    CreateFormBlock,
    TextareaComponent,
    Dropdown,
    InputText,
    MultiSelect
  },
  props: {
    createNetworkListService: {
      type: Function,
      required: true
    },
    listCountriesService: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const options = ref([
      { name: 'ASN', value: 'asn' },
      { name: 'Countries', value: 'countries' },
      { name: 'IP/CIDR', value: 'ip_cidr' }
    ])

    const validationSchema = yup.object({
      name: yup.string().required(),
      networkListType: yup.string().oneOf(options.value.map((option) => option.value)),
      selectedCountries: yup.array().when('networkListType', {
        is: 'countries',
        then: (schema) => schema.required().min(1)
      }),
      ipCidr: yup.string().when('networkListType', {
        is: 'ip_cidr',
        then: (schema) => schema.required()
      }),
      asn: yup.string().when('networkListType', {
        is: 'asn',
        then: (schema) => schema.required()
      })
    })

    const { errors, defineInputBinds, meta, resetForm, values } = useForm({
      validationSchema,
      initialValues: {
        name: '',
        selectedCountries: [],
        networkListType: 'asn',
        asn: '',
        ipCidr: '',
        networkContentList: ''
      }
    })

    const countriesList = ref('')
    const fetchCountries = async () => {
      const result = await props.listCountriesService()
      countriesList.value = result
    }

    onMounted(async () => {
      await fetchCountries()
    })

    const { value: networkListType } = useField('networkListType')
    const { value: selectedCountries } = useField('selectedCountries')
    const { value: networkContentList, setValue: setNetworkContentList } =
      useField('networkContentList')

    const name = defineInputBinds('name', { validateOnInput: true })
    const ipCidr = defineInputBinds('ipCidr', { validateOnInput: true })
    const asn = defineInputBinds('asn', { validateOnInput: true })

    watch([name, networkListType, selectedCountries, ipCidr, asn], () => {
      switch (networkListType.value) {
        case 'countries':
          setNetworkContentList(selectedCountries.value)
          break
        case 'ip_cidr':
          setNetworkContentList(ipCidr.value.value.trim().split('\n'))
          break
        case 'asn':
          setNetworkContentList(asn.value.value.trim().split('\n'))
          break
        default:
          setNetworkContentList('')
          break
      }
    })

    return {
      props,
      options,
      networkListType,
      name,
      ipCidr,
      asn,
      selectedCountries,
      meta,
      resetForm,
      values,
      errors,
      fetchCountries,
      countriesList,
      networkContentList
    }
  }
}
</script>
