<script setup>
  import { useEdgeDNSStore } from '@/stores/edge-dns'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon.vue'
  import { handleCopyDNSSEC } from '../Config/dnssec'

  import { useField } from 'vee-validate'
  import { watch } from 'vue'

  defineProps({
    handleCopyNameServers: {
      type: Function,
      required: true
    }
  })

  const edgeDNSStore = useEdgeDNSStore()

  const { value: domain } = useField('domain')
  const { value: dnssec } = useField('dnssec')

  watch(domain, () => {
    edgeDNSStore.addDomain(domain.value)
  })

  const dnssecData = handleCopyDNSSEC(null, false)
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
    title="Domain Name"
    description="Provide the domain name you want to host."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Domain Name"
          required
          name="domain"
          placeholder="mydomain.com"
          data-testid="edge-dns-form__domain"
        >
          <template #description> Add the root domain name. Example: mydomain.com. </template>
        </FieldText>
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
              v-model="entry.value"
              :data-testid="`edge-dns-form__${entry.name}`"
              :description="entry.description"
              disabled
              icon="pi pi-lock"
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
