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

  const RECORD_TYPES_VALUE_FIELD_INFOS = {
    // eslint-disable-next-line id-length
    A: {
      typeTip: 'Stores a hostname and its corresponding IPv4 address.',
      valueTip: `Maximum of 10 IP addresses, one per line. Only IPv4 format.
              <strong class="block">Example:</strong>
              <span class="block truncate">192.209.210.67</span>
              <span class="block truncate">198.199.105.93</span>`
    },
    AAAA: {
      typeTip: 'Stores a hostname and its corresponding IPv6 address.',
      valueTip: `Maximum of 10 IP addresses, one per line. Only IPv6 formats.
              <strong class="block">Example:</strong>
              <span class="block truncate">2001:db8:3333:4444:5555:6666:7777:8888</span>
              <span class="block truncate">2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF</span>`
    },
    ANAME: {
      typeTip:
        'ALIAS record is a virtual record type created to provide CNAME, like behavior on apex domains.',
      valueTip: `Only one domain for each ANAME type record. Only FQDN format and domains below 'azioncdn.net', 'azionedge.net', and 'azionedge.com' are accepted.
              <strong class="block">Example:</strong>
              <span class="block truncate">32082s.ha.azioncdn.net</span>`
    },
    CAA: {
      typeTip:
        'Allows a domain owner to choose which Certificate Authorities (CAs) can issue certificates for their domain or subdomain.',
      valueTip: `Specify the settings separated by spaces, following the format: [flags] [tag] [“value”]
              <strong class="block">Example:</strong>
              <span class="block truncate">0 issue “ca.example.net”</span>`
    },
    CNAME: {
      typeTip:
        'Can be used to alias a hostname to another hostname. When a DNS client requests a record with a CNAME pointing to another hostname, it looks up the new hostname.',
      valueTip: `Only FQDN format. Only one domain is allowed for each CNAME type record. IP addresses aren't accepted for this kind of record.
              <strong class="block">Example:</strong>
              <span class="block truncate">example.com</span>`
    },
    DS: {
      typeTip:
        "Indicates, in the DNSSEC's Chain of Trust, that the delegated zone can be trusted, by storing the hashed DNSKEY of its KSK (Key-Signing Key).",
      valueTip: `Follow the format: [tag] [algorithm_numeric_id] [digest_numeric_id] [hex_digest]
              <strong class="block">Example:</strong>
              <span class="block truncate">12345 3 1 123456789ABCDEF</span>`
    },
    MX: {
      typeTip:
        'Specifies an SMTP email server for the domain, used to route outgoing emails to an email server.',
      valueTip: `Maximum of 10 addresses, one per line. Follow the format: [priority] [address]
              <strong class="block">Example:</strong>
              <span class="block truncate">10 mailserver.example.com</span>
              <span class="block truncate">20 mailserver2.example.com</span>`
    },
    NS: {
      typeTip: 'NS-records identify the DNS servers responsible (authoritative) for a zone.',
      valueTip: `Maximum of 10 addresses, one per line. FQDN format or IP address. It must point to the servers that have authority over that record.
              <strong class="block">Example:</strong>
              <span class="block truncate">www.ns1.example.com</span>
              <span class="block truncate">www.ns2.example.com</span>`
    },
    PTR: {
      typeTip:
        'Links an IP address to its domain or hostname. Each PTR record should have a matching A record. The usage of a reverse DNS setup is recommended for a mail server.',
      valueTip: `Only FQDN format. Only one answer is allowed.
              <strong class="block">Example:</strong>
              <span class="block truncate">hostname.example.com</span>`
    },
    SRV: {
      typeTip: 'A specification of data in the DNS defining the location.',
      valueTip: `Maximum of 10 records, one per line. The target must point to hostname with an address record (A or AAAA). Use the format: [priority] [weight] [port]
              <strong class="block">Example:</strong>
              <span class="block truncate">10 60 5060 bigbox.example.com</span>`
    },
    TXT: {
      typeTip:
        'Allows adding custom text information to a host or name, useful for describing servers, networks, data centers, or other details.',
      valueTip:
        'Limited to 1000 characters. Text separated by ENTER is considered as a different response.'
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
            {{ selectedRecordTypeInfo?.typeTip }}</small
          >

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
            :step="1"
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
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          v-html="selectedRecordTypeInfo?.valueTip"
        ></small>

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
            :step="1"
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
