<template>
  <FormHorizontal
    :title="`${handleTextDomainWorkload.singularTitle}`"
    :description="`Associate ${handleTextDomainWorkload.singularLabel} with this stream to define the addresses from which the data will be collected.`"
    data-testid="data-stream-form__section__domains"
  >
    <template #inputs>
      <div class="flex flex-col gap-4">
        <FieldGroupRadio
          label="Option"
          nameField="domainOption"
          :isCard="false"
          :options="domainsRadioOptions"
          data-testid="data-stream-form__domains__options-field"
          :disabled="hasNoPermissionToEditDataStream"
        />
      </div>
      <div
        v-if="domainOption === '0'"
        class="flex flex-col gap-2"
      >
        <LabelBlock
          for="domains"
          :label="`${handleTextDomainWorkload.pluralTitle}`"
          data-testid="data-stream-form__domains__domains-field__label"
          isRequired
        />
        <fieldPickList
          :dataPick="domains"
          :service="dataStreamService.listWorkloadsService"
          title="Domains"
          dataKey="id"
        ></fieldPickList>

        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="data-stream-form__domains__domains-description"
        >
          Select an item from the list and then use the arrows to move it between the available and
          selected {{ handleTextDomainWorkload.pluralLabel }} boxes. Use the double-line arrows to
          move all items or press the <code>ctrl</code> or <code>command</code> keys to select
          multiple items.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { computed } from 'vue'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'
  import { dataStreamService } from '@/services/v2'
  import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

  const store = useAccountStore()

  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)

  const domainsRadioOptions = [
    {
      title: `All Current and Future ${handleTextDomainWorkload.pluralTitle}`,
      inputValue: '1',
      subtitle: `By selecting the All Current and Future ${handleTextDomainWorkload.pluralTitle} option, you can activate the Sampling option.`
    },
    {
      title: `Filter ${handleTextDomainWorkload.pluralTitle}`,
      inputValue: '0'
    }
  ]
</script>
