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
        nameField="enableLargeFileCache"
        name="enableLargeFileCache"
        auto
        :isCard="false"
        title="Large file optimization"
        data-testid="edge-application-cache-settings-form__slice-configuration-enabled-field"
        description="Optimize caching for large files by splitting them into smaller fragments for efficient delivery."
      />

      <div
        v-if="showSliceConfigurationRange"
        class="flex flex-col sm:max-w-xs w-full gap-2 pl-14"
      >
        <label
          for="largeFileCacheOffset"
          class="text-color text-sm font-medium"
          >Offset (KB)</label
        >
        <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
          <InputNumber
            class="w-full"
            name="largeFileCacheOffset"
            :min="0"
            :max="1024"
            disabled
            v-model="largeFileCacheOffset"
            id="largeFileCacheOffset"
            placeholder="1024 Kbps"
            type="number"
            data-testid="edge-application-cache-settings-form__slice-configuration-range-field__input"
          />
        </span>

        <small class="text-color-secondary text-xs font-normal leading-5">
          Specifies the fragment size (in KB) for large file optimization. Fixed at 1024 KB.
        </small>
        <small
          v-if="largeFileCacheOffsetError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ largeFileCacheOffsetError }}
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
        subtitle: `Honor cache policies from the origin or define a new maximum cache TTL for the edge. If a TTL isn't received from the origin, cache will be maintained at a default TTL.`,
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
  const { value: largeFileCacheOffset, errorMessage: largeFileCacheOffsetError } =
    useField('largeFileCacheOffset')
  const { value: enableLargeFileCache } = useField('enableLargeFileCache')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')

  const showSliceConfigurationRange = computed(() => {
    return !!enableLargeFileCache.value
  })

  watch(enableLargeFileCache, (value) => {
    cdnCacheSettings.value = value ? 'override' : 'honor'
    emit('enableSliceConfiguration', value)
  })

  const cdnCacheSettingsMaximumTtlMinimumValue = computed(() => {
    if (enableLargeFileCache.value || props.isApplicationAcceleratorEnabled) {
      return CDN_MAXIMUM_TTL_MIN_VALUE
    }
    return CDN_MAXIMUM_TTL_MAX_VALUE
  })
</script>
