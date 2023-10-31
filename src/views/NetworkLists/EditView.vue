<template>
  <EditFormBlock
    pageTitle="Edit Network Lists"
    :editService="this.editNetworkListsService"
    :loadService="this.loadNetworkListsService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
  >
    <template #form>
      <FormHorizontal title="Network List">
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name</label
            >
            <InputText
              placeholder="Add Network List Name"
              v-bind="name"
              type="text"
              :class="{ 'p-invalid': errors.key }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
          </div>
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="id"
              class="text-color text-base font-medium"
              >Type</label
            >
            <Dropdown
              :class="{ 'p-invalid': errors.type }"
              v-model="listType.value"
              v-bind="listType"
              disabled
              :options="options"
              optionLabel="name"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="listType.value === 'asn'"
          >
            <label
              for="id"
              class="text-color text-base font-medium"
              >List</label
            >
            <TextareaComponent
              :class="{ 'p-invalid': errors.ans }"
              v-bind="asn"
              rows="2"
              cols="30"
              id="list"
              placeholder="1234&#10;4321"
            />
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="listType.value === 'ip_cidr'"
          >
            <label
              for="id"
              class="text-color text-base font-medium"
              >List</label
            >
            <TextareaComponent
              disabled
              :class="{ 'p-invalid': errors.ipCidr }"
              v-bind="ipCidr"
              rows="2"
              id="ipCidr"
              cols="30"
              placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16"
            />
          </div>
          <div
            class="flex flex-col w-full sm:max-w-3xl gap-2"
            v-if="listType.value === 'countries'"
          >
            <label
              for="select-01"
              class="text-color text-base font-medium"
              >Countries</label
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
  import { ref, onMounted, watch } from 'vue'
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
        name: yup.string().required(),
        listType: yup
          .string()
          .oneOf(
            options.value.map((option) => option.value).filter((option) => option !== 'ip_cidr')
          ),
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

      const { errors, defineInputBinds, meta, values, setValues } = useForm({
        validationSchema
      })
      const countriesList = ref('')
      const fetchCountries = async () => {
        const result = await props.listCountriesService()
        countriesList.value = result
      }
      const name = defineInputBinds('name', { validateOnInput: true })
      const listType = defineInputBinds('listType', { validateOnInput: true })
      const ipCidr = defineInputBinds('itemsValues', { validateOnInput: true })
      const { value: selectedCountries } = useField('itemsValues')
      const asn = defineInputBinds('itemsValues', { validateOnInput: true })
      const { value: networkContentList, setValue: setNetworkContentList } =
        useField('networkContentList')
      onMounted(async () => {
        await fetchCountries()
      })
      watch([name, listType, selectedCountries, ipCidr, asn], () => {
        switch (listType.value.value) {
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
        errors,
        meta,
        values,
        name,
        listType,
        setValues,
        options,
        countriesList,
        selectedCountries,
        networkContentList,
        ipCidr,
        asn
      }
    }
  }
</script>
