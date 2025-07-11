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
          :isCard="true"
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
        <FieldPickList
          :dataPick="domains"
          :service="dataStreamService.listWorkloadsService"
          title="Domains"
          dataKey="id"
        />

        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="data-stream-form__domains__domains-description"
        >
          Select an item from the list and then use the arrows to move it between the available and
          selected domains boxes. Use the double-line arrows to move all items or press the ctrl or
          command keys to select multiple items.
        </small>
      </div>

      <div
        v-if="domainOption === '1'"
        class="flex flex-col w-full gap-2"
      >
        <FieldSwitchBlock
          :disabled="hasNoPermissionToEditDataStream"
          nameField="hasSampling"
          name="hasSampling"
          :value="hasSampling"
          auto
          :isCard="false"
          title="Sampling"
          description="Enable sampling to collect a percentage of the data instead of the entire dataset, optimizing resource usage."
          data-testid="data-stream-sampling-field"
        />

        <div
          v-if="hasSampling"
          class="flex flex-col sm:max-w-xs w-full gap-2 pl-14"
        >
          <FieldNumber
            :disabled="hasNoPermissionToEditDataStream"
            label="Sampling Rate (%)"
            name="samplingPercentage"
            :min="0"
            :max="100"
            :value="samplingPercentage"
            description="Percentage of data to be collected. A value of 100% collects all data, while lower values collect a proportional sample."
            placeholder="100%"
            :useGrouping="false"
            data-testid="data-stream-form__transform__sampling_rate"
          />
        </div>
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
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldPickList from '@/templates/form-fields-inputs/fieldPickList.vue'
  import LabelBlock from '@/templates/label-block'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

  const store = useAccountStore()

  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')

  const { value: hasSampling } = useField('hasSampling')
  const { value: samplingPercentage } = useField('samplingPercentage')

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)

  const domainsRadioOptions = [
    {
      title: `All Current and Future ${handleTextDomainWorkload.pluralTitle}`,
      inputValue: '1',
      subtitle: `By selecting the All Current and Future ${handleTextDomainWorkload.pluralTitle} option, you can activate the Sampling option.`
    },
    {
      title: `Filter ${handleTextDomainWorkload.pluralTitle}`,
      subtitle: `Select specific ${handleTextDomainWorkload.pluralTitle} to filter the data collected by this stream.`,
      inputValue: '0'
    }
  ]
</script>
