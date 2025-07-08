<template>
  <FormHorizontal
    v-if="isAllDomainsSelected && hasAccessToSampling"
    title="Sampling"
    description="Enable this option to reduce costs of data collection and analysis."
    data-testid="data-stream-form__section__sampling"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-8">
        <FieldSwitchBlock
          :disabled="hasNoPermissionToEditDataStream"
          nameField="hasSampling"
          name="hasSampling"
          auto
          :isCard="false"
          title="Active"
          subtitle="Once enabled, you can only have one active stream in your account. If it's later disabled, the Add option will become available again on the creation page."
          data-testid="data-stream-form__sampling__active-field"
        />

        <div
          class="flex flex-col sm:max-w-lg w-full gap-2"
          v-if="hasSampling"
        >
          <FieldNumber
            :disabled="hasNoPermissionToEditDataStream"
            label="Sampling Percentage (%)"
            name="samplingPercentage"
            :value="samplingPercentage"
            description="Percentage value received in return of the total data related to all domains."
            :min="0"
            :max="100"
            data-testid="data-stream-form__sampling__percentage-field"
          />
        </div>
        <InlineMessage
          class="w-fit"
          severity="warn"
          v-if="hasSampling"
          data-testid="data-stream-form__sampling__inline-message"
        >
          After activating and saving these settings, all other streams will become inactive.
        </InlineMessage>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { computed } from 'vue'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'

  const store = useAccountStore()

  const { value: hasSampling } = useField('hasSampling')
  const { value: samplingPercentage } = useField('samplingPercentage')

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)
  const isAllDomainsSelected = computed(() => {
    return store.domainOption === '1'
  })
  const hasAccessToSampling = computed(() => {
    return store.hasSamplingFlag
  })
</script>
