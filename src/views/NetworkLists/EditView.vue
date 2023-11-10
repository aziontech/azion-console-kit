<template>
  <EditFormBlock
    pageTitle="Edit Network List"
    :editService="this.editNetworkListsService"
    :loadService="this.loadNetworkListsService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
  >
    <template #form>
      <FormHorizontal
        title="Network List"
        description="Create allowlists, blocklists, and even greylists based on IP addresses, geolocation (countries), or Autonomous System Number (ASN) to use with configured rule sets on Rules Engine."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              placeholder="My network list"
              v-bind="name"
              type="text"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="id"
              class="text-color text-base font-medium"
              >Type *</label
            >
            <Dropdown
              :class="{ 'p-invalid': errors.networkListType }"
              v-model="networkListType.value"
              v-bind="networkListType"
              disabled
              :options="options"
              optionLabel="name"
              optionValue="value"
              class="w-full"
            />
            <small
              v-if="errors.networkListType"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.networkListType }}</small
            >
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="networkListType.value === 'asn'"
          >
            <label
              for="id"
              class="text-color text-base font-medium"
              >List *</label
            >
            <TextareaComponent
              :class="{ 'p-invalid': errors.itemsValues }"
              v-bind="itemsValues"
              rows="2"
              cols="30"
              id="list"
              placeholder="1234&#10;4321"
            />
            <small
              v-if="errors.itemsValues"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.itemsValues }}</small
            >
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="networkListType.value === 'ip_cidr'"
          >
            <label
              for="id"
              class="text-color text-base font-medium"
              >List *</label
            >
            <TextareaComponent
              disabled
              :class="{ 'p-invalid': errors.itemsValues }"
              v-bind="itemsValues"
              rows="2"
              id="ipCidr"
              cols="30"
              placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16"
            />
            <small
              v-if="errors.itemsValues"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.itemsValues }}</small
            >
          </div>
          <div
            class="flex flex-col w-full sm:max-w-3xl gap-2"
            v-if="networkListType.value === 'countries'"
          >
            <label
              for="select-01"
              class="text-color text-base font-medium"
              >Countries *</label
            >
            <MultiSelect
              v-model="itemsValuesCountry"
              :options="countriesList"
              filter
              optionLabel="name"
              optionValue="value"
              placeholder="Select Countries"
              :class="{ 'p-invalid': errors.itemsValuesCountry }"
              class="w-full"
              display="chip"
            />
            <small
              v-if="errors.itemsValuesCountry"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.itemsValuesCountry }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </EditFormBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import MultiSelect from 'primevue/multiselect'
  import TextareaComponent from 'primevue/textarea'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, onMounted } from 'vue'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  export default {
    name: 'edit-network-lists-view',
    components: {
      EditFormBlock,
      InputText,
      Dropdown,
      MultiSelect,
      TextareaComponent,
      FormHorizontal
    },
    props: {
      loadNetworkListsService: { type: Function, required: true },
      editNetworkListsService: { type: Function, required: true },
      listCountriesService: { type: Function, required: true }
    },
    data: (props) => {
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
          then: (schema) => schema.required('Countries is a required field').min(1)
        })
      })

      const { errors, defineInputBinds, meta, values, setValues } = useForm({
        validationSchema
      })
      const countriesList = ref('')
      const fetchCountries = async () => {
        const result = await props.listCountriesService()
        countriesList.value = result
      }
      const name = defineInputBinds('name', { validateOnInput: true })
      const itemsValues = defineInputBinds('itemsValues', { validateOnInput: true })
      const networkListType = defineInputBinds('networkListType', { validateOnInput: true })
      const { value: itemsValuesCountry } = useField('itemsValuesCountry')
      onMounted(async () => {
        await fetchCountries()
      })

      return {
        errors,
        meta,
        values,
        name,
        networkListType,
        setValues,
        options,
        countriesList,
        itemsValues,
        itemsValuesCountry
      }
    }
  }
</script>
