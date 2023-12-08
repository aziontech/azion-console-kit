<script setup>
  import { ref, computed } from 'vue'
  import { useIntelligentDNSStore } from '@/stores/intelligent-dns'

  import InputText from 'primevue/inputtext'
  import Textarea from 'primevue/textarea'
  import Dropdown from 'primevue/dropdown'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: selectedPolicy, errorMessage: errorSelectedPolicy } = useField('selectedPolicy')
  const { value: selectedRecordType, errorMessage: errorSelectedRecordType } =
    useField('selectedRecordType')
  const { value: value, errorMessage: errorValue } = useField('value')
  const { value: ttl, errorMessage: errorTtl } = useField('ttl')
  const { value: weight, errorMessage: errorWeight } = useField('weight')
  const { value: description, errorMessage: errorDescription } = useField('description')

  const intelligentDNSStore = useIntelligentDNSStore()

  const RECORD_TYPE_WITHOUT_TTL = 'ANAME'

  const policyList = ref([
    { label: 'Simple', value: 'simple' },
    { label: 'Weighted', value: 'weighted' }
  ])

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

  const isWeightedPolicy = computed(() => {
    return selectedPolicy.value === 'weighted'
  })

  const showTTLField = computed(() => {
    return selectedRecordType.value !== RECORD_TYPE_WITHOUT_TTL
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Settings"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Record Name *</label
        >
        <div class="p-inputgroup">
          <InputText
            v-model="name"
            id="name"
            type="text"
            :class="{ 'p-invalid': errorName }"
          />
          <span class="p-inputgroup-addon"> .{{ intelligentDNSStore.domain }} </span>
        </div>
        <small class="text-color-secondary text-sm font-normal leading-tight">
          A record is used to find the IP address of a computer connected to the internet from a
          name.
        </small>

        <small
          v-if="errorName"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorName }}</small
        >
      </div>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <label
            for="type"
            class="text-color text-base font-medium"
            >Record Type *</label
          >
          <Dropdown
            v-model="selectedRecordType"
            :options="recordsTypes"
            optionLabel="label"
            id="type"
            optionValue="value"
            placeholder="Select a Record Type"
            :class="{ 'p-invalid': errorSelectedRecordType }"
            class="w-full"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            Address Mapping record (A Record)— also known as a DNS host record, stores a hostname
            and its corresponding IPv4 address.
          </small>

          <small
            v-if="errorSelectedRecordType"
            class="p-error text-xs font-normal leading-tight"
            >{{ errorSelectedRecordType }}</small
          >
        </div>

        <div
          v-if="showTTLField"
          class="flex flex-col sm:max-w-xs w-full gap-2"
        >
          <label
            for="ttl"
            class="text-color text-base font-medium"
            >TTL *</label
          >
          <InputText
            placeholder="TTL (seconds):"
            v-model="ttl"
            id="ttl"
            type="number"
            :class="{ 'p-invalid': errorTtl }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            Time-to-live (TTL) is a value in an Internet Protocol (IP) packet that tells a network
            router whether or not the packet has been in the network too long and should be
            discarded.
          </small>
          <small
            v-if="errorTtl"
            class="p-error text-xs font-normal leading-tight"
            >{{ errorTtl }}</small
          >
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="value"
          class="text-color text-base font-medium"
          >Value *</label
        >
        <Textarea
          rows="5"
          cols="30"
          placeholder="Value"
          v-model="value"
          id="value"
          type="text"
          :class="{ 'p-invalid': errorValue }"
        />
        <small class="text-color-secondary text-sm font-normal leading-tight">
          Enter multiple values on separate lines. Only IPV4 formats.
        </small>

        <small
          v-if="errorValue"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorValue }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    :isDrawer="true"
    title="Policy"
    description="Description"
  >
    <template #inputs>
      <div class="flex gap-6 flex-wrap">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <label
            for="selectedPolicy"
            class="text-color text-base font-medium"
            >Policy Type *</label
          >
          <Dropdown
            v-model="selectedPolicy"
            :options="policyList"
            id="selectedPolicy"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a Policy"
            :class="{ 'p-invalid': errorSelectedPolicy }"
            class="w-full"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            Choose this policy to specify the amount of traffic to send to each record.
          </small>

          <small
            v-if="errorSelectedPolicy"
            class="p-error text-xs font-normal leading-tight"
            >{{ errorSelectedPolicy }}</small
          >
        </div>
        <div
          class="flex flex-col sm:max-w-xs w-full gap-2"
          v-if="isWeightedPolicy"
        >
          <label
            for="weight"
            class="text-color text-base font-medium"
            >Weight *</label
          >
          <InputText
            placeholder="Weight"
            v-model="weight"
            id="weight"
            type="number"
            min="0"
            max="255"
            :class="{ 'p-invalid': errorWeight }"
            v-if="isWeightedPolicy"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            You can choose a number between 0 and 255 to specify the weight for each record. When
            you choose 0, Intelligent DNS stops using this record.
          </small>

          <small
            v-if="errorWeight"
            class="p-error text-xs font-normal leading-tight"
            >{{ errorWeight }}</small
          >
        </div>
      </div>

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isWeightedPolicy"
      >
        <label
          for="description"
          class="text-color text-base font-medium"
          >Description *</label
        >
        <InputText
          placeholder="add the description"
          v-model="description"
          type="text"
          :class="{ 'p-invalid': errorDescription }"
          v-if="isWeightedPolicy"
        />
        <small class="text-color-secondary text-sm font-normal leading-tight">
          To differentiate records with the same name and type, add a description that identifies
          each record.
        </small>

        <small
          v-if="errorDescription"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorDescription }}</small
        >
      </div>
    </template>
  </FormHorizontal>
</template>
