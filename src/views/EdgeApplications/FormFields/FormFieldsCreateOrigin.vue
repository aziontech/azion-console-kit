<template>
  <FormHorizontal
    data-testid="form-horizontal-default-origin"
    isDrawer
    :hiddenTitle="true"
    :noBorder="true"
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <LabelBlock
          for="origin-type"
          data-testid="form-horizontal-default-origin-type-label"
          label="Type"
          isRequired
        />
        <span class="p-input-icon-right">
          <i class="pi pi-lock text-[var(--text-color-secondary)]" />
          <Dropdown
            appendTo="self"
            :options="ORIGIN_TYPE_LIST_OPTIONS"
            v-model="originType"
            optionLabel="label"
            optionValue="value"
            placeholder="Select an origin type"
            disabled
            class="w-full"
            :pt="{
              trigger: {
                class: 'hidden'
              }
            }"
            data-testid="form-horizontal-default-origin-type-dropdown"
          />
        </span>
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="form-horizontal-default-origin-type-description"
        >
          The origin type is pre-defined and can't be customized.
        </small>
      </div>

      <FieldGroupRadio
        label="Protocol Policy"
        nameField="originProtocolPolicy"
        :isCard="false"
        :options="policyProtocolRadioOptions"
        helpText="Select the protocol usage between the edge nodes and the origin."
        data-testid="form-horizontal-default-origin-protocol-policy"
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="form-horizontal-default-origin-address-field-text"
          label="Address"
          required
          name="addresses[0].address"
          :value="addresses[0].value.address"
          aria-describedby="address-help"
          placeholder="example.com"
          description="Define an origin for the content in FQDN format or an IPv4/IPv6 address."
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="form-horizontal-default-origin-host-header-field-text"
          label="Host Header"
          required
          name="hostHeader"
          aria-describedby="hostHeader-help"
          placeholder="${host}"
          :value="hostHeader"
          description="Identify a virtualhost sent in the Host header to the origin."
        />
      </div>
    </template>
  </FormHorizontal>
</template>
<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import LabelBlock from '@/templates/label-block'

  import { useField, useFieldArray } from 'vee-validate'

  const { value: originType } = useField('originType')
  const { value: hostHeader } = useField('hostHeader')
  const { fields: addresses } = useFieldArray('addresses')

  const ORIGIN_TYPE_LIST_OPTIONS = [{ label: 'Single Origin', value: 'single_origin' }]
  const policyProtocolRadioOptions = [
    { title: 'Preserve HTTP/HTTPS', inputValue: 'preserve' },
    { title: 'Enforce HTTP', inputValue: 'http' },
    { title: 'Enforce HTTPS', inputValue: 'https' }
  ]
</script>
