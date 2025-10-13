<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import MultiSelect from 'primevue/multiselect'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import LabelBlock from '@/templates/label-block'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'

  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'

  const props = defineProps({
    listCountriesService: {
      type: Function,
      required: true
    }
  })

  const countriesList = ref([])

  const { value: networkListType } = useField('networkListType')
  const { value: selectedCountries, errorMessage: selectedCountriesError } =
    useField('selectedCountries')
  const { setValue: setNetworkContentList } = useField('networkContentList')
  const { value: name } = useField('name')
  const { value: ipCidr } = useField('ipCidr')
  const { value: asn } = useField('asn')

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

  const networkGrouRadio = computed(() => [
    {
      title: 'ASN',
      subtitle:
        'An Autonomous System Number (ASN) uniquely identifies a network on the Internet. Enter one ASN per line (e.g., 13335).',
      inputValue: 'asn',
      disabled: false
    },
    {
      title: 'IP/CIDR',
      subtitle:
        'An IP Address or CIDR uniquely identifies a network on the Internet. Enter one IP Address or CIDR per line (e.g., 192.168.1.1/24).',
      inputValue: 'ip_cidr',
      disabled: false
    },
    {
      title: 'Countries',
      subtitle: 'Select one or more countries to build a geolocation-based list.',
      inputValue: 'countries',
      disabled: false
    }
  ])

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
    description="Create allowlists, blocklists, and even greylists based on IP addresses, geolocation (countries), or Autonomous System Number (ASN) to use with Rules Engine for Firewall."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My Network List"
          :value="name"
          description="Give a unique and descriptive name to identify the network list."
          data-testid="network-list-form__name"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Network List Settings"
    description="Specificy the type of network list you want to create and the properties that'll compose the list."
  >
    <template #inputs>
      <FieldGroupRadio
        isCard
        nameField="networkListType"
        :options="networkGrouRadio"
      />
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isAsnNetWorkType"
      >
        <FieldTextArea
          label="List"
          required
          placeholder="1234&#10;4321"
          name="asn"
          rows="2"
          cols="30"
          :value="asn"
          description="An Autonomous System Number (ASN) uniquely identifies a network on the Internet. Enter one ASN per line (e.g., 13335). Public ASNs: 1–64511; private: 64512–65535. Duplicate entries are removed."
          data-testid="network-list-form__asn-list"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isIpCidrNetworkType"
      >
        <FieldTextArea
          label="List"
          required
          placeholder="185.241.208.232&#10;194.26.192.64&#10;171.25.193.25 #comment"
          name="ipCidr"
          rows="16"
          cols="30"
          :value="ipCidr"
          data-testid="network-list-form__ipcidr-list"
        >
          <template #description>
            <small class="text-xs text-color-secondary font-normal leading-5">
              Separate each address value by using a new line and, optionally, use
              <code>#</code> to add a comment and <code>--LT</code> to add a date. Duplicated
              entries are automatically removed.
            </small>
          </template>
        </FieldTextArea>
      </div>
      <div
        class="flex flex-col w-full sm:max-w-3xl gap-2"
        v-if="isCountriesNetworkType"
      >
        <LabelBlock
          for="select-01"
          label="Countries"
          isRequired
        />
        <MultiSelect
          id="countriesList"
          v-model="selectedCountries"
          :options="countriesList"
          filter
          name="selectedCountries"
          autoFilterFocus
          optionLabel="name"
          optionValue="value"
          placeholder="Select Countries"
          :class="{ 'p-invalid': selectedCountriesError }"
          class="w-full"
          display="chip"
          data-testid="network-list-form__countries__multiselect"
        />
        <small
          v-if="selectedCountriesError"
          class="p-error text-xs font-normal leading-tight"
          >{{ selectedCountriesError }}
        </small>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select one or more countries.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>
