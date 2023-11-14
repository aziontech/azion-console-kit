<template>
  <CreateFormBlock
    pageTitle="Create Network List"
    :createService="createNetworkListService"
    :formData="values"
    :formMeta="meta"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <FormHorizontal
        title="General"
        description="description"
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              v-bind="name"
              id="name"
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
        </template>
      </FormHorizontal>
      <FormHorizontal
        title="List Settings"
        description="description"
      >
        <template #inputs>
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="id"
              class="text-color text-base font-medium"
              >Type *</label
            >
            <Dropdown
              :class="{ 'p-invalid': errors.networkListType }"
              v-model="networkListType"
              :options="options"
              optionLabel="name"
              optionValue="value"
              class="w-full md:w-14rem"
            />
            <small
              v-if="errors.networkListType"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.networkListType }}</small
            >
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="networkListType === 'asn'"
          >
            <label
              for="id"
              class="text-color text-base font-medium"
              >List *</label
            >
            <TextareaComponent
              :class="{ 'p-invalid': errors.asn }"
              v-bind="asn"
              rows="2"
              cols="30"
              id="list"
              placeholder="1234&#10;4321"
            />
            <small
              v-if="errors.asn"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.asn }}</small
            >
            <small class="text-xs text-color-secondary font-normal leading-tight"
              >Separate ASN (e.g. 1234) using a new line. Duplicate entries will be automatically
              removed.</small
            >
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="networkListType === 'ip_cidr'"
          >
            <label
              for="id"
              class="text-color text-base font-medium"
              >List *</label
            >
            <TextareaComponent
              :class="{ 'p-invalid': errors.ipCidr }"
              v-bind="ipCidr"
              rows="2"
              id="ipCidr"
              cols="30"
              placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16"
            />
            <small
              v-if="errors.ipCidr"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.ipCidr }}</small
            >
          </div>
          <div
            class="flex flex-col w-full sm:max-w-3xl gap-2"
            v-if="networkListType === 'countries'"
          >
            <label
              for="select-01"
              class="text-color text-base font-medium"
              >Countries *</label
            >
            <MultiSelect
              v-model="selectedCountries"
              :options="countriesList"
              filter
              optionLabel="name"
              optionValue="value"
              placeholder="Select Countries"
              :class="{ 'p-invalid': errors.selectedCountries }"
              class="w-full"
              display="chip"
            />
            <small
              v-if="errors.selectedCountries"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.selectedCountries }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>

<script>
  import { ref, onMounted, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  import CreateFormBlock from '@/templates/create-form-block-new'
  import TextareaComponent from 'primevue/textarea'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import MultiSelect from 'primevue/multiselect'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  export default {
    components: {
      CreateFormBlock,
      TextareaComponent,
      Dropdown,
      InputText,
      MultiSelect,
      FormHorizontal
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
