<script setup>
  import TextareaComponent from 'primevue/textarea'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import MultiSelect from 'primevue/multiselect'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useField } from 'vee-validate'

  const props = defineProps({
    listCountriesService: {
      type: Function,
      required: true
    }
  })

  const options = ref([
    { name: 'ASN', value: 'asn' },
    { name: 'Countries', value: 'countries' },
    { name: 'IP/CIDR', value: 'ip_cidr' }
  ])
  const countriesList = ref([])

  const { value: networkListType, errorMessage: networkListTypeError } = useField('networkListType')
  const { value: selectedCountries, errorMessage: selectedCountriesError } =
    useField('selectedCountries')
  const { value: networkContentList, setValue: setNetworkContentList } =
    useField('networkContentList')
  const { value: name, errorMessage: nameError } = useField('name')
  const { value: ipCidr, errorMessage: ipCidrError } = useField('ipCidr')
  const { value: asn, errorMessage: asnError } = useField('asn')

  async function fetchCountries() {
    const result = await props.listCountriesService()
    countriesList.value = result
  }

  const isAsnNetWorkType = computed(() => {
    return networkListType.value === 'asn'
  })
  const isIpCidrNetworkType = computed(() => {
    return networkListType.value === 'ip_cidr'
  })
  const isCountriesNetworkType = computed(() => {
    return networkListType.value === 'countries'
  })

  onMounted(async () => {
    await fetchCountries()
  })

  watch([name, networkListType, selectedCountries, ipCidr, asn], () => {
    switch (networkListType.value) {
      case 'countries':
        setNetworkContentList(selectedCountries.value)
        break
      case 'ip_cidr':
        setNetworkContentList(ipCidr.value?.trim().split('\n'))
        break
      case 'asn':
        setNetworkContentList(asn.value?.trim().split('\n'))
        break
      default:
        setNetworkContentList('')
        break
    }
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create allowlists, blocklists, and even greylists based on IP addresses, geolocation (countries), or Autonomous System Number (ASN) to use with configured rule sets on Rules Engine."
  >
    <template #inputs>
      <InputText
        hidden
        v-model="networkContentList"
      />
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          placeholder="My network list"
          v-model="name"
          id="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Give a unique and easy-to-remember name.</small
        >
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Network List Settings"
    description="Specificy the type of network list you want to create and the properties that'll compose the list."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Type *</label
        >
        <Dropdown
          :class="{ 'p-invalid': networkListTypeError }"
          v-model="networkListType"
          :options="options"
          optionLabel="name"
          optionValue="value"
          class="w-full md:w-14rem"
        />
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Each list type accepts different values.</small
        >
        <small
          v-if="networkListTypeError"
          class="p-error text-xs font-normal leading-tight"
          >{{ networkListTypeError }}</small
        >
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isAsnNetWorkType"
      >
        <label
          for="id"
          class="text-color text-base font-medium"
          >List *</label
        >
        <TextareaComponent
          :class="{ 'p-invalid': asnError }"
          v-model="asn"
          rows="2"
          cols="30"
          id="list"
          placeholder="1234&#10;4321"
        />
        <small
          v-if="asnError"
          class="p-error text-xs font-normal leading-tight"
          >{{ asnError }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Separate each ASN value by using a new line. Duplicated entries are automatically
          removed.</small
        >
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isIpCidrNetworkType"
      >
        <label
          for="id"
          class="text-color text-base font-medium"
          >List *</label
        >
        <TextareaComponent
          :class="{ 'p-invalid': ipCidrError }"
          v-model="ipCidr"
          rows="2"
          id="ipCidr"
          cols="30"
          placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16"
        />

        <small
          v-if="ipCidrError"
          class="p-error text-xs font-normal leading-tight"
          >{{ ipCidrError }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Separate each address value by using a new line. Duplicated entries are automatically
          removed.
        </small>
      </div>
      <div
        class="flex flex-col w-full sm:max-w-3xl gap-2"
        v-if="isCountriesNetworkType"
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
          :class="{ 'p-invalid': selectedCountriesError }"
          class="w-full"
          display="chip"
        />
        <small
          v-if="selectedCountriesError"
          class="p-error text-xs font-normal leading-tight"
          >{{ selectedCountriesError }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Select one or more countries.</small
        >
      </div>
    </template>
  </FormHorizontal>
</template>
