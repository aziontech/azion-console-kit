<script setup>
  import { useEdgeDNSStore } from '@/stores/edge-dns'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon.vue'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import LabelBlock from '@/templates/label-block'
  import copyBlock from '@/templates/copy-block/copy-block.vue'
  import { useField } from 'vee-validate'
  import { watch, ref } from 'vue'
  import { handleCopyDNSSEC } from '../Config/dnssec.js'

  defineProps({
    handleCopy: {
      type: Function,
      required: true
    }
  })

  const edgeDNSStore = useEdgeDNSStore()

  const { value: id } = useField('id')
  const { value: domain } = useField('domain')
  const { value: nameservers } = useField('nameservers')
  const { value: dnssec } = useField('dnssec')

  const dnssecData = ref([])
  const refreshDNSSECTime = 5000

  dnssecData.value = handleCopyDNSSEC(null, true)

  const loadEdgeDNSSEC = async (DNSZone) => {
    const data = await edgeDNSService.loadEdgeDNSZoneDNSSEC(DNSZone)
    if (!data) return

    if (!data.enabled) return

    if (data.status === 'waiting') {
      setTimeout(() => {
        loadEdgeDNSSEC(DNSZone)
      }, refreshDNSSECTime)
    }
    dnssecData.value = handleCopyDNSSEC(data.delegationSigner, true)
  }

  watch(id, (value) => {
    loadEdgeDNSSEC(value)
  })

  watch(domain, () => {
    edgeDNSStore.addDomain(domain.value)
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create zones to host your domains on Azion's distributed infrastructure."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My zone"
          data-testid="edge-dns-form__name"
          description="Give a unique and descriptive name to identify your zone."
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Domain"
    description="Provide the domain name you want to host."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextIcon
          label="Domain Name"
          name="domain"
          placeholder="mydomain.com"
          data-testid="edge-dns-form__domain"
          disabled
          icon="pi pi-lock"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Configure your Nameserver"
    description="Set Azion Edge DNS as the authoritative DNS server for a domain by copying the nameservers values."
  >
    <template #inputs>
      <div class="flex flex-col gap-3">
        <LabelBlock label="Nameservers" />
        <div
          class="flex items-center sm:max-w-lg w-full gap-2"
          v-for="(nameserver, index) in nameservers"
          :key="index"
        >
          <div class="sm:max-w-xs w-full">
            <FieldTextIcon
              :name="`nameserver-${index}`"
              :value="nameserver"
              data-testid="edge-dns-form__nameserver"
              disabled
              icon="pi pi-lock"
            />
          </div>
          <div>
            <copyBlock
              :value="nameserver"
              v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
            />
          </div>
        </div>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Add the nameservers in your domain provider.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="DNSSEC"
    description="Enable DNSSEC to secure your DNS zone against cache poisoning and spoofing attacks. Make sure to configure the Key Tag and Digest values in your domain provider to complete the DNSSEC setup."
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="dnssec"
          name="dnssec"
          auto
          :isCard="false"
          title="Enable DNSSEC"
          data-testid="edge-dns-form__dnssec"
        />
      </div>
      <div
        v-if="dnssec"
        class="flex flex-col gap-8"
      >
        <div
          class="flex items-center sm:max-w-lg w-full gap-2"
          v-for="(entry, index) in dnssecData"
          :key="index"
        >
          <div class="sm:max-w-xs gap-2 w-full flex flex-col">
            <FieldTextIcon
              class="w-full"
              :label="entry.label"
              required
              :name="entry.name"
              :value="entry.value"
              :data-testid="`edge-dns-form__${entry.name}`"
              :description="entry.description"
              disabled
              icon="pi pi-lock"
            />
          </div>
          <div :class="entry.name === 'key-tag' || entry.name === 'digest' ? 'mb-6' : ''">
            <copyBlock
              :value="entry.value"
              :disabled="entry.disabledCopyButton"
              v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
            />
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="isActive"
          name="isActive"
          auto
          :isCard="false"
          title="Active"
          data-testid="edge-dns-form__status"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
