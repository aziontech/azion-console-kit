<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import InputNumber from 'primevue/inputnumber'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'
  import FieldGroupCheckbox from '@/templates/form-fields-inputs/fieldGroupCheckbox'
  import Dropdown from 'primevue/dropdown'
  import { CDN_MAXIMUM_TTL_MAX_VALUE, CDN_MAXIMUM_TTL_MIN_VALUE } from '@/utils/constants'

  import TextArea from 'primevue/textarea'
  import { useField, useFieldArray } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const emit = defineEmits(['l2-caching-enabled'])

  const props = defineProps({
    isEnableApplicationAccelerator: {
      required: true,
      type: Boolean
    },
    showTieredCache: {
      type: Boolean,
      required: true
    }
  })

  const TIERED_CACHE_REGION = ref([
    {
      label: 'na-united-states',
      value: 'na-united-states'
    },
    {
      label: 'sa-brazil',
      value: 'sa-brazil'
    }
  ])

  const cdnCacheSettingsMaximumTtlMinimumValue = computed(() => {
    if (l2CachingEnabled.value || props.isEnableApplicationAccelerator) {
      return CDN_MAXIMUM_TTL_MIN_VALUE
    }
    return CDN_MAXIMUM_TTL_MAX_VALUE
  })

  const MAX_VALUE_NUMBER_INPUT = 31536000

  const { value: browserCacheSettings } = useField('browserCacheSettings')
  const {
    value: browserCacheSettingsMaximumTtl,
    errorMessage: browserCacheSettingsMaximumTtlError
  } = useField('browserCacheSettingsMaximumTtl')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')
  const { value: cdnCacheSettingsMaximumTtl, errorMessage: cdnCacheSettingsMaximumTtlError } =
    useField('cdnCacheSettingsMaximumTtl')
  const { value: sliceConfigurationEnabled } = useField('sliceConfigurationEnabled')
  const { value: sliceConfigurationRange } = useField('sliceConfigurationRange')
  const { value: isSliceL2CachingEnabled } = useField('isSliceL2CachingEnabled')
  const { value: cacheByQueryString } = useField('cacheByQueryString')
  const { value: queryStringFields, errorMessage: queryStringFieldsError } =
    useField('queryStringFields')
  const { value: l2CachingEnabled } = useField('l2CachingEnabled')
  const { value: l2Region } = useField('l2Region')
  const { value: isSliceEdgeCachingEnabled } = useField('isSliceEdgeCachingEnabled')

  const { value: cacheByCookies } = useField('cacheByCookies')
  const { value: cookieNames, errorMessage: cookieNamesError } = useField('cookieNames')
  const { value: adaptiveDeliveryAction } = useField('adaptiveDeliveryAction')
  const {
    fields: deviceGroup,
    push: addDeviceGroup,
    remove: removeDeviceGroup
  } = useFieldArray('deviceGroup')

  const showMaxTtl = computed(() => browserCacheSettings.value === 'override')
  const showCdnMaxTtl = computed(() => cdnCacheSettings.value === 'override')
  const showSliceConfigurationRange = computed(() => {
    return !!sliceConfigurationEnabled.value
  })
  const showQueryFields = computed(() => {
    return ['whitelist', 'blacklist'].includes(cacheByQueryString.value)
  })
  const showCookieNames = computed(() => {
    return ['whitelist', 'blacklist'].includes(cacheByCookies.value)
  })
  const showDeviceGroupFields = computed(() => {
    return adaptiveDeliveryAction.value === 'whitelist'
  })

  const cacheSettingsRadioOptions = (type) => {
    const isBrowser = type === 'browser'

    const browserSubtitle =
      'Honor cache policies from the origin or define a new maximum cache TTL for browsers.'
    const cdnSubtitle = `Honor cache policies from the origin or define a new maximum cache TTL for the edge. If a TTL isn't received from the origin, cache will be maintained at a default TTL.`

    return [
      {
        title: 'Honor cache policies',
        subtitle: isBrowser ? browserSubtitle : cdnSubtitle,
        value: 'honor',
        disabled: !isBrowser && l2CachingEnabled.value
      },
      { title: 'Override cache settings', value: 'override' }
    ]
  }

  const layerFileOptimizationRadioOptions = computed(() => [
    {
      title: 'Edge Cache',
      value: true,
      disabled: showSliceConfigurationRange.value,
      nameField: 'isSliceEdgeCachingEnabled',
      binary: true
    },
    {
      title: 'Tiered Cache',
      value: false,
      disabled: !l2CachingEnabled.value,
      nameField: 'isSliceL2CachingEnabled',
      binary: true
    }
  ])

  const queryStringRadioOptions = [
    {
      title: 'Content does not vary by Query String (Improves Caching)',
      value: 'ignore'
    },
    {
      title: 'Content varies by some Query String fields (Allowlist)',
      value: 'whitelist',
      disabled: !props.isEnableApplicationAccelerator
    },
    {
      title: 'Content varies by Query String, except for some fields (Blocklist)',
      value: 'blacklist',
      disabled: !props.isEnableApplicationAccelerator
    },
    {
      title: 'Content varies by all Query String fields',
      value: 'all'
    }
  ]

  const cookieRadioOptions = [
    {
      title: 'Content does not vary by Cookies (Improves Caching)',
      value: 'ignore'
    },
    {
      title: 'Content varies by some Cookies (Allowlist)',
      value: 'whitelist',
      disabled: !props.isEnableApplicationAccelerator
    },
    {
      title: 'Content varies by Cookies, with the exception of a few (Blocklist)',
      value: 'blacklist',
      disabled: !props.isEnableApplicationAccelerator
    },
    {
      title: 'Content varies by all Cookies',
      value: 'all',
      disabled: !props.isEnableApplicationAccelerator
    }
  ]

  const adaptiveDeliveryRadioOptions = [
    {
      title: 'Content does not vary by Device Groups (Improves Caching)',
      value: 'ignore'
    },
    {
      title: 'Content varies by some Device Groups (Allowlist)',
      value: 'whitelist'
    }
  ]

  const advancedCacheSwitchOptions = computed(() => {
    const options = [
      {
        title: 'Enable Stale Cache',
        nameField: 'enableStaleCache',
        subtitle: 'Serve stale content from the cache if origin servers are unavailable.'
      }
    ]

    if (props.isEnableApplicationAccelerator) {
      options.push(
        {
          title: 'Query String Sort',
          nameField: 'enableQueryStringSort',
          subtitle:
            'Consider objects with the same query strings, regardless of the order of the fields, as the same cached file.'
        },
        {
          title: 'Enable Caching for POST',
          nameField: 'enableCachingForPost',
          subtitle:
            'Allow POST requests to be cached. The POST method will be included in the cache key.'
        },
        {
          title: 'Enable Caching for OPTIONS',
          nameField: 'enableCachingForOptions',
          subtitle:
            'Allow OPTIONS requests to be cached. The OPTIONS method will be included in the cache key.'
        }
      )
    }

    return options
  })

  watch(adaptiveDeliveryAction, (value) => {
    if (value === 'whitelist' && deviceGroup.value.length === 0) {
      addDeviceGroup({ id: '' })
    }
  })

  watch(l2CachingEnabled, (value) => {
    emit('l2-caching-enabled', value)

    if (value) {
      cdnCacheSettings.value = 'override'
      isSliceEdgeCachingEnabled.value = true
      sliceConfigurationEnabled.value = true
      return
    }

    isSliceL2CachingEnabled.value = false

    const hasNotApplicationAcceleratorAndExceedMinimumValue =
      !props.isEnableApplicationAccelerator &&
      cdnCacheSettingsMaximumTtl.value < CDN_MAXIMUM_TTL_MAX_VALUE

    if (!value && hasNotApplicationAcceleratorAndExceedMinimumValue) {
      cdnCacheSettingsMaximumTtl.value = CDN_MAXIMUM_TTL_MAX_VALUE
    }
  })

  watch(sliceConfigurationEnabled, (value) => {
    isSliceEdgeCachingEnabled.value = value
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create a set of cache configurations to apply to the edge application. Use Rules Engine to activate cache settings."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          name="name"
          label="Name *"
          placeholder="My cache setting"
          description="Give a unique and descriptive name to identify the setting."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Cache Expiration Policies"
    description="Define how the edge should handle TTL values sent by the origin as well as how long your content should remain cached at the edge."
    :isDrawer="true"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Browser Cache Settings"
        nameField="browserCacheSettings"
        :isCard="false"
        :options="cacheSettingsRadioOptions('browser')"
      />

      <div
        v-if="showMaxTtl"
        class="flex flex-col sm:max-w-xs w-full gap-2"
      >
        <label
          for="browserCacheSettingsMaximumTtl"
          class="text-color text-sm font-medium"
          >Maximum TTL (seconds) *</label
        >

        <InputNumber
          showButtons
          v-model="browserCacheSettingsMaximumTtl"
          id="browserCacheSettingsMaximumTtl"
          :min="0"
          :max="31536000"
          :step="1"
          :class="{ 'p-invalid': browserCacheSettingsMaximumTtlError }"
        />
        <small
          v-if="browserCacheSettingsMaximumTtlError"
          class="p-error text-xs font-normal leading-tight"
          >{{ browserCacheSettingsMaximumTtlError }}</small
        >
      </div>

      <FieldGroupRadio
        label="Edge Cache Settings"
        nameField="cdnCacheSettings"
        :isCard="false"
        :options="cacheSettingsRadioOptions('cdn')"
      />

      <div class="flex flex-col sm:max-w-xs w-full gap-2">
        <label
          for="cdnCacheSettingsMaximumTtl"
          class="text-color text-sm font-medium"
        >
          {{ showCdnMaxTtl ? 'Maximum TTL (seconds)' : 'Default TTL' }}
        </label>
        <InputNumber
          showButtons
          v-model="cdnCacheSettingsMaximumTtl"
          id="cdnCacheSettingsMaximumTtl"
          :min="cdnCacheSettingsMaximumTtlMinimumValue"
          :max="MAX_VALUE_NUMBER_INPUT"
          :step="1"
          :class="{ 'p-invalid': cdnCacheSettingsMaximumTtlError }"
        />
        <small class="text-color-secondary text-xs font-normal leading-5">
          Enable Application Accelerator in the Main Settings tab to use values lower than 60
          seconds. Tiered Cache requires cache TTL to be equal to or greater than 3 seconds.
        </small>
        <small
          v-if="cdnCacheSettingsMaximumTtlError"
          class="p-error text-xs font-normal leading-tight"
          >{{ cdnCacheSettingsMaximumTtlError }}</small
        >
      </div>

      <div
        class="flex gap-2 w-full items-start"
        v-if="props.showTieredCache"
      >
        <FieldSwitchBlock
          nameField="l2CachingEnabled"
          name="l2CachingEnabled"
          auto
          :isCard="false"
          title="Tiered Cache"
          subtitle="Enable Tiered Cache if you want to reduce the traffic to your origin and increase
            performance and availability."
        />
      </div>

      <div
        class="flex flex-col w-full sm:max-w-xs gap-2"
        v-if="props.showTieredCache"
      >
        <label
          for="method"
          class="text-color text-sm font-medium leading-5"
          >Tiered Cache Region</label
        >
        <Dropdown
          appendTo="self"
          inputId="originId"
          v-model="l2Region"
          :disabled="!l2CachingEnabled"
          :options="TIERED_CACHE_REGION"
          optionLabel="label"
          option-value="value"
          placeholder="Select an Tiered Cache Region"
        />
        <small class="text-xs text-color-secondary font-normal leading-5"
          >Choose an Tiered Cache Region suitable for your application.</small
        >
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Large File Optimization"
    description="Enable file segmentation to break down large files into small fragments that can be cached at the edge."
    :isDrawer="true"
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="sliceConfigurationEnabled"
        name="sliceConfigurationEnabled"
        auto
        :isCard="false"
        title="Active"
      />

      <FieldGroupCheckbox
        v-if="showSliceConfigurationRange"
        label="Layer"
        :options="layerFileOptimizationRadioOptions"
        :isCard="false"
      />
      <div
        v-if="showSliceConfigurationRange"
        class="flex flex-col sm:max-w-xs w-full gap-2"
      >
        <label
          for="sliceConfigurationRange"
          class="text-color text-sm font-medium"
          >Fragment Size (KB)</label
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
          />
        </span>

        <small class="text-color-secondary text-xs font-normal leading-5">
          Define the range of segmentation of large files.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Advanced Cache Key"
    description="Define the behavior of your application toward cache segmentation of objects through query string fields or cookies."
    :isDrawer="true"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Cache by Query String"
        nameField="cacheByQueryString"
        :isCard="false"
        :options="queryStringRadioOptions"
      />

      <div
        v-if="showQueryFields"
        class="flex flex-col sm:max-w-lg w-full gap-2"
      >
        <label
          for="queryStringFields"
          class="text-color text-sm font-medium"
          >Query String Fields *</label
        >
        <TextArea
          id="queryStringFields"
          v-model="queryStringFields"
          :class="{ 'p-invalid': queryStringFieldsError }"
          rows="5"
          cols="30"
          placeholder="name"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Separate query fields using line breaks.
        </small>
        <small class="p-error">{{ queryStringFieldsError }}</small>
      </div>

      <FieldGroupSwitch
        label="Enable Settings"
        :isCard="false"
        :options="advancedCacheSwitchOptions"
      />

      <FieldGroupRadio
        label="Cache by Cookie"
        nameField="cacheByCookies"
        :isCard="false"
        :options="cookieRadioOptions"
      />

      <div
        v-if="showCookieNames"
        class="flex flex-col sm:max-w-lg w-full gap-2"
      >
        <label
          for="cookieNames"
          class="text-color text-sm font-medium"
          >Cookie Names *</label
        >
        <TextArea
          id="cookieNames"
          v-model="cookieNames"
          :class="{ 'p-invalid': cookieNamesError }"
          rows="5"
          cols="30"
          placeholder="cookie_name"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Separate cookies using line breaks.
        </small>
        <small class="p-error">{{ cookieNamesError }}</small>
      </div>

      <FieldGroupRadio
        label="Adaptive Delivery"
        nameField="adaptiveDeliveryAction"
        :isCard="false"
        :options="adaptiveDeliveryRadioOptions"
      />

      <div
        v-if="showDeviceGroupFields"
        class="flex flex-col w-full sm:max-w-3xl gap-2"
      >
        <label class="text-color text-sm font-medium leading-5">Device Group ID</label>
        <div class="flex flex-col gap-2 max-w-lg">
          <div
            v-for="(deviceGroupItem, index) in deviceGroup"
            :key="deviceGroupItem.key"
          >
            <FieldInputGroup
              placeholder="ID"
              :name="`deviceGroup[${index}].id`"
              :value="deviceGroup[index].value.id"
            >
              <template #button>
                <PrimeButton
                  v-if="!deviceGroupItem.isFirst"
                  icon="pi pi-trash"
                  size="small"
                  outlined
                  @click="removeDeviceGroup(index)"
                />
              </template>
            </FieldInputGroup>
          </div>

          <PrimeButton
            outlined
            label="Add Device Group"
            icon="pi pi-plus-circle"
            class="w-fit"
            @click="addDeviceGroup({ id: '' })"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
