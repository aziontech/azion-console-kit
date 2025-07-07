<template>
  <FormHorizontal
    title="Edge Cache"
    description="Manage caching at the edge to improve performance and reduce latency for end users."
    isDrawer
  >
    <template #inputs>
      <FieldGroupRadio
        label="Edge Cache Settings"
        nameField="cdnCacheSettings"
        :isCard="false"
        :options="getEdgeCacheRadioOptions()"
        data-testid="edge-application-cache-settings-form__cdn-cache-settings-field"
      />

      <div class="flex flex-col sm:max-w-xs w-full gap-2">
        <LabelBlock
          for="cdnCacheSettingsMaximumTtl"
          label="Max Age"
          isRequired
        />
        <InputNumber
          showButtons
          v-model="cdnCacheSettingsMaximumTtl"
          id="cdnCacheSettingsMaximumTtl"
          :min="cdnCacheSettingsMaximumTtlMinimumValue"
          :max="CDN_CACHE_MAX_VALUE"
          :step="1"
          :class="{ 'p-invalid': cdnCacheSettingsMaximumTtlError }"
          data-testid="edge-application-cache-settings-form__cdn-cache-settings-maximum-ttl-field__input"
        />
        <small class="text-color-secondary text-xs font-normal leading-5">
          Maximum time (in seconds) content is cached at the edge.
        </small>
        <small
          v-if="cdnCacheSettingsMaximumTtlError"
          class="p-error text-xs font-normal leading-tight"
          >{{ cdnCacheSettingsMaximumTtlError }}</small
        >
      </div>

      <FieldSwitchBlock
        nameField="enableStaleCache"
        name="enableStaleCache"
        auto
        :isCard="false"
        title="Stale cache"
        data-testid="edge-application-cache-settings-form__slice-configuration-enabled-field"
        description="Enable stale cache to serve expired content temporarily while fetching updated content from the origin."
      />

      <FieldSwitchBlock
        nameField="sliceConfigurationEnabled"
        name="sliceConfigurationEnabled"
        auto
        :isCard="false"
        title="Large file optimization"
        data-testid="edge-application-cache-settings-form__slice-configuration-enabled-field"
        description="Optimize caching for large files by splitting them into smaller fragments for efficient delivery."
      />

      <div
        v-if="showSliceConfigurationRange"
        class="flex flex-col sm:max-w-xs w-full gap-2"
      >
        <label
          for="sliceConfigurationRange"
          class="text-color text-sm font-medium"
          >Offset (KB)</label
        >
        <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
          <i class="pi pi-lock text-color-secondary" />
          <InputNumber
            class="w-full"
            name="sliceConfigurationRange"
            :min="1024"
            :max="1024"
            v-model="sliceConfigurationRange"
            id="sliceConfigurationRange"
            placeholder="1024 Kbps"
            type="number"
            disabled
            data-testid="edge-application-cache-settings-form__slice-configuration-range-field__input"
          />
        </span>

        <small class="text-color-secondary text-xs font-normal leading-5">
          Specify the fragment size (in KB) of each slice when optimizing large files. Valid range:
          1-1024.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { computed, watch } from 'vue'
  import { useField } from 'vee-validate'
  import {
    CDN_MAXIMUM_TTL_MAX_VALUE,
    CDN_MAXIMUM_TTL_MIN_VALUE,
    CDN_CACHE_MAX_VALUE
  } from '@/utils/constants'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import LabelBlock from '@/templates/label-block'
  import InputNumber from 'primevue/inputnumber'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  const emit = defineEmits(['enableSliceConfiguration'])

  const props = defineProps({
    isApplicationAcceleratorEnabled: {
      type: Boolean,
      required: true
    }
  })

  const getEdgeCacheRadioOptions = () => {
    return [
      {
        title: 'Honor cache policies',
        subtitle:
          'Use the cache policies defined by the origin server, or set a custom maximum cache TTL for edge caching.',
        inputValue: 'honor',
        disabled: !!showSliceConfigurationRange.value
      },
      {
        title: 'Override cache settings',
        subtitle: `Customize the edge cache behavior by overriding the origin server's cache policies.`,
        inputValue: 'override'
      }
    ]
  }

  const { value: cdnCacheSettingsMaximumTtl, errorMessage: cdnCacheSettingsMaximumTtlError } =
    useField('cdnCacheSettingsMaximumTtl')
  const { value: sliceConfigurationRange } = useField('sliceConfigurationRange')
  const { value: sliceConfigurationEnabled } = useField('sliceConfigurationEnabled')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')

  const showSliceConfigurationRange = computed(() => {
    return !!sliceConfigurationEnabled.value
  })

  watch(sliceConfigurationEnabled, (value) => {
    cdnCacheSettings.value = value ? 'override' : 'honor'
    emit('enableSliceConfiguration', value)
  })

  const cdnCacheSettingsMaximumTtlMinimumValue = computed(() => {
    if (sliceConfigurationEnabled.value || props.isApplicationAcceleratorEnabled) {
      return CDN_MAXIMUM_TTL_MIN_VALUE
    }
    return CDN_MAXIMUM_TTL_MAX_VALUE
  })
</script>
