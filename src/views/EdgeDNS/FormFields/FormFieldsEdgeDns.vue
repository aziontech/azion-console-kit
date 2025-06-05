<script setup>
  import { useEdgeDNSStore } from '@/stores/edge-dns'
  import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

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
    :title="`${handleTextDomainWorkload.singularTitle}`"
    description="Provide the domain name you want to host."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          :label="`${handleTextDomainWorkload.singularTitle} Name`"
          required
          name="domain"
          placeholder="mydomain.com"
          data-testid="edge-dns-form__domain"
        >
          <template #description>
            Add the root {{ handleTextDomainWorkload.singularLabel }} name. Example:
            <code>mydomain.com</code>.
          </template>
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
