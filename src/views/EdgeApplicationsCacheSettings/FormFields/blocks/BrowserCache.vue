<template>
  <FormHorizontal
    title="Browser Cache"
    description="Define how the browser handles cached content. Configure the behavior to optimize performance and ensure up-to-date content delivery."
    :isDrawer="true"
  >
    <template #inputs>
      <FieldGroupRadio
        nameField="browserCacheSettings"
        :isCard="false"
        :options="getBrowserCacheRadioOptions()"
        data-testid="edge-application-cache-settings-form__browser-cache-settings-field"
      />

      <div
        v-if="showMaxTtl"
        class="flex flex-col sm:max-w-xs w-full gap-2"
      >
        <LabelBlock
          for="browserCacheSettingsMaximumTtl"
          label="Max Age"
          isRequired
        />

        <InputNumber
          showButtons
          v-model="browserCacheSettingsMaximumTtl"
          id="browserCacheSettingsMaximumTtl"
          :min="0"
          :max="31536000"
          :step="1"
          :class="{ 'p-invalid': browserCacheSettingsMaximumTtlError }"
          :pt="{
            input: {
              name: 'browserCacheSettingsMaximumTtl'
            }
          }"
          data-testid="edge-application-cache-settings-form__browser-cache-settings-maximum-ttl-field__input"
        />
        <small class="text-color-secondary text-xs font-normal leading-5">
          Maximum time (in seconds) content can be cached by the browser.
        </small>
        <small
          v-if="browserCacheSettingsMaximumTtlError"
          class="p-error text-xs font-normal leading-tight"
          >{{ browserCacheSettingsMaximumTtlError }}</small
        >
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio.vue'
  import LabelBlock from '@/templates/form-fields-inputs/labelBlock.vue'
  import InputNumber from 'primevue/inputnumber'
  import { useField } from 'vee-validate'
  import { computed, watch } from 'vue'

  const {
    value: browserCacheSettingsMaximumTtl,
    errorMessage: browserCacheSettingsMaximumTtlError
  } = useField('browserCacheSettingsMaximumTtl')
  const { value: browserCacheSettings } = useField('browserCacheSettings')

  const getBrowserCacheRadioOptions = () => {
    return [
      {
        title: 'Honor cache policies',
        subtitle: 'Respect the cache policies defined by the origin server.',
        inputValue: 'honor'
      },
      {
        title: 'Override cache settings',
        subtitle: `Override the origin server's cache policies and define a custom cache behavior for browsers.`,
        inputValue: 'override'
      },
      {
        title: 'No cache',
        subtitle:
          'Disable browser caching to ensure content is always fetched directly from the server',
        inputValue: 'no-cache'
      }
    ]
  }

  const showMaxTtl = computed(() => browserCacheSettings.value === 'override')

  watch(browserCacheSettings, (cacheSettings) => {
    if (cacheSettings === 'no-cache') browserCacheSettingsMaximumTtl.value = 0
  })
</script>
