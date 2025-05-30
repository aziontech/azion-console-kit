<script setup>
  import { useEdgeDNSStore } from '@/stores/edge-dns'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea.vue'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import { documentationGuideProducts } from '@/helpers'
  import { useField } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { TTL_MAX_VALUE_RECORDS, TTL_DEFAULT, TTL_DEFAULT_ANAME } from '@/utils/constants'
  import LabelBlock from '@/templates/label-block'
  const { value: name, errorMessage: errorName } = useField('name')
  const { value: selectedPolicy } = useField('selectedPolicy')
  const { value: selectedRecordType } = useField('selectedRecordType')
  const { value: ttl } = useField('ttl')
  const { value: weight } = useField('weight')
  const { value: description } = useField('description')
  const edgeDNSStore = useEdgeDNSStore()

  const RECORD_TYPE_WITH_DEFAULT_TTL = 'ANAME'

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
    ttl.value = enableTTLField.value ? TTL_DEFAULT : TTL_DEFAULT_ANAME
  }

  const RECORD_TYPES_VALUE_FIELD_INFOS = {
    // eslint-disable-next-line id-length
    A: {
      valueTip: 'Accepts IPv4 address.',
      valuePlaceholder: '192.0.2.1'
    },
    AAAA: {
      valueTip: 'Accepts IPv6 address.',
      valuePlaceholder: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
    },
    ANAME: {
      valueTip: 'Maps a name to another name, but as an A record.',
      valuePlaceholder: 'example.com'
    },
    CAA: {
      valueTip:
        'Specifies which CAs are allowed to issue certificates. Format: [flags] [tag] "[value]".',
      valuePlaceholder: '0 issue "letsencrypt.org"'
    },
    CNAME: {
      valueTip: 'Accepts canonical name for an alias.',
      valuePlaceholder: 'example.com'
    },
    DS: {
      valueTip:
        'Accepts the Delegation Signer for DNSSEC. Format: [key tag] [algorithm] [digest type] [digest].',
      valuePlaceholder: '12345 8 2 49FD46E6C4B45C55D4AC'
    },
    MX: {
      valueTip: 'Accepts the format: [preference] [mail exchanger].',
      valuePlaceholder: '10 mail.example.com'
    },
    NS: {
      valueTip: 'Accepts the name server for the domain.',
      valuePlaceholder: 'ns1.example.com'
    },
    PTR: {
      valueTip: 'Accepts the corresponding forward hostname.',
      valuePlaceholder: 'example.com'
    },
    SRV: {
      valueTip: 'Accepts the format: [priority] [weight] [port] [target].',
      valuePlaceholder: '10 5 5060 sipserver.example.com'
    },
    TXT: {
      valueTip: 'Accepts textual data, multiple answers, one answer per line. Format: "[text]"',
      valuePlaceholder: '"v=spf1 include:example.com ~all"'
    }
  }

  const selectedRecordTypeInfo = computed(() => {
    if (!selectedRecordType.value) return null

    return RECORD_TYPES_VALUE_FIELD_INFOS[selectedRecordType.value]
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Settings"
    description="Add records to specify which IPs are associated with the domain and how Edge DNS should handle requests for the domain. The accepted value's format varies according to the chosen record type."
    data-testid="edge-dns-records-form__section__settings"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <LabelBlock
          for="name"
          label="Name"
          isRequired
          data-testid="edge-dns-records-form__settings__name-field__label"
        />
        <div class="p-inputgroup">
          <InputText
            v-model="name"
            name="name"
            placeholder="subdomain"
            id="name"
            type="text"
            :class="{ 'p-invalid': errorName }"
            data-testid="edge-dns-records-form__settings__name-field__input"
          />
          <span
            class="p-inputgroup-addon"
            data-testid="edge-dns-records-form__settings__name-field__suffix"
          >
            .{{ edgeDNSStore.domain }}
          </span>
        </div>
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="edge-dns-records-form__settings__name-field__description"
        >
          > Use @ to create a record for the root domain.
        </small>
        <small
          v-if="errorName"
          data-testid="edge-dns-records-form__settings__name-field__error-message"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ errorName }}
        </small>
      </div>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldDropdown
            label="Record Type"
            required
            name="selectedRecordType"
            :options="recordsTypes"
            :loading="!recordsTypes.length"
            @change="setTtlByRecordType"
            optionLabel="label"
            optionValue="value"
            :value="selectedRecordType"
            placeholder="Select a Record Type"
            data-testid="edge-dns-records-form__settings__record-type-field"
          >
            <template #description>
              <PrimeButton
                label="Read more about Record Types"
                link
                class="text-xs p-0 leading-5 text-start"
                @click="documentationGuideProducts.edgeDnsRecordTypes"
                data-testid="edge-dns-records-form__settings__record-type-field__read-more-btn"
              />
            </template>
          </FieldDropdown>
        </div>

        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldNumber
            label="TTL (seconds)"
            required
            name="ttl"
            description="Decide the time-to-live (TTL) value a response can be cached for on a resolver server."
            placeholder="TTL (seconds):"
            :min="0"
            :max="TTL_MAX_VALUE_RECORDS"
            :value="ttl"
            showButtons
            :step="1"
            data-testid="edge-dns-records-form__settings__ttl-field"
          />
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="Value"
          required
          name="value"
          :placeholder="selectedRecordTypeInfo?.valuePlaceholder"
          :description="selectedRecordTypeInfo?.valueTip"
          data-testid="edge-dns-records-form__settings__value-field"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    :isDrawer="true"
    title="Policy"
    description="Choose the policy type to specify how Edge DNS should deal with requests answered by this record."
    data-testid="edge-dns-records-form__section__policy"
  >
    <template #inputs>
      <div class="flex gap-6 flex-wrap">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldDropdown
            label="Policy Type"
            required
            name="selectedPolicy"
            :options="policyList"
            :loading="!policyList.length"
            optionLabel="label"
            optionValue="value"
            :value="selectedPolicy"
            placeholder="Select a Record Type"
            data-testid="edge-dns-records-form__policy__policy-type-field"
          >
            <template #description>
              Choose <code>Simple</code> to use the standard DNS functionality or
              <code>Weighted</code> to specify the amount of traffic sent to each record.
            </template>
          </FieldDropdown>
        </div>
        <div
          class="flex flex-col sm:max-w-xs w-full gap-2"
          v-if="isWeightedPolicy"
        >
          <FieldNumber
            label="Weight"
            required
            name="weight"
            description="Specify the weight for each record. Accepts integers between 0 and 255."
            placeholder="Weight"
            showButtons
            :value="weight"
            :disabled="!enableTTLField"
            :min="0"
            :max="255"
            :step="1"
            data-testid="edge-dns-records-form__policy__weight-field"
          />
        </div>
      </div>

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isWeightedPolicy"
      >
        <FieldTextArea
          label="Description"
          required
          :value="description"
          name="description"
          placeholder="add the description"
          description="Differentiate records with the same Name and Type by adding a description that identifies each one. Accepts up to 45 characters."
          data-testid="edge-dns-records-form__policy__description-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
