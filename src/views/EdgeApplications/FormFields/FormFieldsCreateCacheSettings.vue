<template>
  <FormHorizontal
    :isDrawer="true"
    data-testid="form-horizontal-cache-expiration-policies"
    :hiddenTitle="true"
    :noBorder="true"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Browser Cache Settings"
        nameField="browserCacheSettings"
        :isCard="false"
        :options="optionsBrowser"
        data-testid="form-horizontal-cache-expiration-policies-browser-cache-settings"
      />

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="!isBrowserCacheTypeHonor"
        data-testid="form-horizontal-cache-expiration-policies-browser-cache-settings-maximum-ttl"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="maximun-ttl-seconds"
            class="text-color text-base font-medium"
            data-testid="form-horizontal-cache-expiration-policies-browser-cache-settings-maximum-ttl-label"
          >
            Maximum TTL (seconds)
          </label>

          <InputNumber
            :value="browserCacheSettingsMaximumTtl"
            name="browserCacheSettingsMaximumTtl"
            showButtons
            data-testid="form-horizontal-cache-expiration-policies-browser-cache-settings-maximum-ttl-input"
          />
        </div>
      </div>

      <FieldGroupRadio
        label="Edge Cache Settings"
        nameField="cdnCacheSettings"
        :isCard="false"
        :options="optionsEdgeCache"
        data-testid="form-horizontal-cache-expiration-policies-edge-cache-settings"
      />

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        data-testid="form-horizontal-cache-expiration-policies-edge-cache-settings-maximum-ttl"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="cdn-maximun-ttl-seconds"
            class="text-color text-base font-medium"
            data-testid="form-horizontal-cache-expiration-policies-edge-cache-settings-maximum-ttl-label"
          >
            {{ cdnCacheSettingsIsOverride ? 'Maximum TTL (seconds)' : 'Default TTL' }}
          </label>

          <InputNumber
            showButtons
            :value="cdnCacheSettingsMaximumTtl"
            name="cdnCacheSettingsMaximumTtl"
            data-testid="form-horizontal-cache-expiration-policies-edge-cache-settings-maximum-ttl-input"
          />

          <div
            class="text-color-secondary text-sm font-normal"
            data-testid="form-horizontal-cache-expiration-policies-edge-cache-settings-maximum-ttl-description"
          >
            Enable Application Accelerator in the Main Settings tab to use values lower than 60
            seconds. Tiered Cache requires cache TTL to be equal to or greater than 3 seconds.
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import InputNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import { computed } from 'vue'
  import { useField } from 'vee-validate'

  const optionsBrowser = [
    { title: 'Override cache settings', inputValue: 'override' },
    {
      title: 'Honor cache policies',
      subtitle:
        'Honor cache policies from the origin or define a new maximum cache TTL for browsers.',
      inputValue: 'honor'
    }
  ]
  const optionsEdgeCache = [
    { title: 'Override cache settings', inputValue: 'override' },
    {
      title: 'Honor cache policies',
      subtitle: `Honor cache policies from the origin or define a new maximum cache TTL for the edge. If a TTL isn't received from the origin, cache will be maintained at a default TTL.`,
      inputValue: 'honor'
    }
  ]
  const { value: browserCacheSettings } = useField('browserCacheSettings')
  const { value: browserCacheSettingsMaximumTtl } = useField('browserCacheSettingsMaximumTtl')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')
  const { value: cdnCacheSettingsMaximumTtl } = useField('cdnCacheSettingsMaximumTtl')
  const cdnCacheSettingsIsOverride = computed(() => cdnCacheSettings.value === 'override')
  const isBrowserCacheTypeHonor = computed(() => browserCacheSettings.value === 'honor')
</script>
