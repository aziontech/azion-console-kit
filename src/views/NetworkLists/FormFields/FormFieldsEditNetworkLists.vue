<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import MultiSelect from 'primevue/multiselect'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import PrimeTag from 'primevue/tag'

  import { useField } from 'vee-validate'
  import { computed, onMounted, ref } from 'vue'
  import LabelBlock from '@/templates/label-block'

  import { handleTypeNetwork } from '../Config/typeNetwork'

  const props = defineProps({
    listCountriesService: {
      type: Function,
      required: true
    }
  })

  const countriesList = ref([])


  const { value: name } = useField('name')
  const { value: itemsValues } = useField('itemsValues')
  const { value: networkListType } = useField('networkListType')
  const { value: itemsValuesCountry, errorMessage: itemsValuesCountryError } =
    useField('itemsValuesCountry')

  const networkGrouRadio = computed(() => handleTypeNetwork(true, networkListType.value))

  const fetchCountries = async () => {
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
</script>

<template>
  <FormHorizontal
    title="General"
    description="Edit allowlists, blocklists, and even greylists based on IP addresses, geolocation (countries), or Autonomous System Number (ASN) to use with Rules Engine for Firewall."
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
      >
        <template #footer="{ item }">
          <PrimeTag
            v-if="item?.tag"
            :value="item.tag.value"
            :icon="item.tag.icon"
            severity="info"
            class="mt-3"
          />
        </template>
      </FieldGroupRadio>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isAsnNetWorkType"
      >
        <FieldTextArea
          label="List"
          required
          placeholder="13335&#10;53331"
          name="itemsValues"
          rows="2"
          :value="itemsValues"
          data-testid="network-list-form__asn-list"
          description="Enter one ASN per line (e.g., 13335). Public ASNs: 1–64511; private: 64512–65535. Duplicated entries are automatically removed."
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
          name="itemsValues"
          rows="16"
          :value="itemsValues"
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
          v-model="itemsValuesCountry"
          :options="countriesList"
          :loading="!countriesList.length"
          :disabled="!countriesList.length"
          name="itemsValuesCountry"
          filter
          autoFilterFocus
          optionLabel="name"
          optionValue="value"
          placeholder="Select Countries"
          :class="{ 'p-invalid': itemsValuesCountryError }"
          data-testid="network-list-form__countries__multiselect"
          class="w-full"
          display="chip"
        />
        <small
          v-if="itemsValuesCountryError"
          class="p-error text-xs font-normal leading-tight"
          >{{ itemsValuesCountryError }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select one or more countries.</small
        >
      </div>
    </template>
  </FormHorizontal>
</template>
