<script setup>
  import { useEdgeDNSStore } from '@/stores/edge-dns'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
  import InputText from 'primevue/inputtext'
  import Textarea from 'primevue/textarea'
  import { useField } from 'vee-validate'
  import { computed, ref } from 'vue'

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: selectedPolicy, errorMessage: errorSelectedPolicy } = useField('selectedPolicy')
  const { value: selectedRecordType, errorMessage: errorSelectedRecordType } =
    useField('selectedRecordType')
  const { value, errorMessage: errorValue } = useField('value')
  const { value: ttl, errorMessage: errorTtl } = useField('ttl')
  const { value: weight, errorMessage: errorWeight } = useField('weight')
  const { value: description, errorMessage: errorDescription } = useField('description')

  const edgeDNSStore = useEdgeDNSStore()

  const RECORD_TYPE_WITH_DEFAULT_TTL = 'ANAME'
  const TTL_DEFAULT_VALUE = 20

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

  const enableTTLField = computed(() => {
    return selectedRecordType.value !== RECORD_TYPE_WITH_DEFAULT_TTL
  })

  const setTtlByRecordType = () => {
    if (!enableTTLField.value) ttl.value = TTL_DEFAULT_VALUE
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Settings"
    description="Add records to specify which IPs are associated with the domain and how Edge DNS should handle requests for the domain."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <div class="p-inputgroup">
          <InputText
            v-model="name"
            placeholder="My record"
            id="name"
            type="text"
            :class="{ 'p-invalid': errorName }"
          />
          <span class="p-inputgroup-addon"> .{{ edgeDNSStore.domain }} </span>
        </div>
        <small class="text-xs text-color-secondary font-normal leading-5">
          The accepted values format vary according to the chosen record type.
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
            appendTo="self"
            v-model="selectedRecordType"
            @change="setTtlByRecordType"
            :options="recordsTypes"
            optionLabel="label"
            id="type"
            optionValue="value"
            placeholder="Select a Record Type"
            :class="{ 'p-invalid': errorSelectedRecordType }"
            class="w-full"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Choose the type of record being added.
          </small>

          <small
            v-if="errorSelectedRecordType"
            class="p-error text-xs font-normal leading-tight"
            >{{ errorSelectedRecordType }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <label
            for="ttl"
            class="text-color text-base font-medium"
            >TTL (seconds) *</label
          >

          <InputNumber
            showButtons
            :disabled="!enableTTLField"
            placeholder="TTL (seconds):"
            v-model="ttl"
            id="ttl"
            :min="0"
            :max="3600"
            step="1"
            :class="{ 'p-invalid': errorTtl }"
          />

          <small class="text-xs text-color-secondary font-normal leading-5">
            Decide the time-to-live (TTL) value a response can be cached for on a resolver server.
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
        <small class="text-xs text-color-secondary font-normal leading-5">
          The accepted values format vary according to the chosen record type.
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
    description="Choose the policy type to specify how Edge DNS should deal with requests answered by this record."
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
            appendTo="self"
            v-model="selectedPolicy"
            :options="policyList"
            id="selectedPolicy"
            optionLabel="label"
            optionValue="value"
            :class="{ 'p-invalid': errorSelectedPolicy }"
            class="w-full"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Choose <code>Simple</code> to use the standard DNS functionality or
            <code>Weighted</code> to specify the amount of traffic sent to each record.
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
          <InputNumber
            showButtons
            placeholder="Weight"
            v-model="weight"
            id="weight"
            :min="0"
            :max="255"
            step="1"
            :class="{ 'p-invalid': errorWeight }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Specify the weight for each record. Accepts integers between 0 and 255.
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
        <Textarea
          v-if="isWeightedPolicy"
          rows="5"
          cols="30"
          placeholder="add the description"
          v-model="description"
          id="description"
          type="text"
          :class="{ 'p-invalid': errorDescription }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Differentiate records with the same Name and Type by adding a description that identifies
          each one. Accepts up to 45 characters.
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
