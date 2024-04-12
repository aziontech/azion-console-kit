<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import Dropdown from 'primevue/dropdown'
  import CheckboxPrime from 'primevue/checkbox'

  import TextArea from 'primevue/textarea'
  import { useField, useFieldArray } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

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
      label: 'Select an Tiered Cache Region',
      value: ''
    },
    {
      label: 'na-united-states',
      value: 'na-united-states'
    },
    {
      label: 'sa-brazil',
      value: 'sa-brazil'
    }
  ])

  const CACHE_SETTINGS_OPTIONS = ref([
    {
      label: 'Honor Origin Cache Headers',
      value: 'honor'
    },
    {
      label: 'Override Cache Settings',
      value: 'override'
    }
  ])
  const DEVICE_GROUP_CACHE_OPTIONS = ref([
    {
      label: 'Content does not vary by Device Groups (Improves Caching)',
      value: 'ignore'
    },
    {
      label: 'Content varies by some Device Groups (Allowlist)',
      value: 'whitelist'
    }
  ])

  const QUERY_STRING_OPTIONS = ref([
    {
      label: 'Content does not vary by Query String (Improves Caching)',
      value: 'ignore'
    },
    {
      label: 'Content varies by some Query String fields (Allowlist)',
      value: 'whitelist'
    },
    {
      label: 'Content varies by Query String, except for some fields (Blocklist)',
      value: 'blacklist'
    },
    {
      label: 'Content varies by all Query String fields',
      value: 'all'
    }
  ])

  const COOKIES_OPTIONS = ref([
    {
      label: 'Content does not vary by Cookies (Improves Caching)',
      value: 'ignore'
    },
    {
      label: 'Content varies by some Cookies (Allowlist)',
      value: 'whitelist'
    },
    {
      label: 'Content varies by Cookies, with the exception of a few (Blocklist)',
      value: 'blacklist'
    },
    {
      label: 'Content varies by all Cookies',
      value: 'all'
    }
  ])

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

  const { value: enableQueryStringSort } = useField('enableQueryStringSort')
  const { value: enableCachingForPost } = useField('enableCachingForPost')
  const { value: enableCachingForOptions } = useField('enableCachingForOptions')
  const { value: enableStaleCache } = useField('enableStaleCache')
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

  const disabledQueryStringOptions = (option) => {
    const isDisabled =
      (option.value === 'whitelist' || option.value === 'blacklist') &&
      !props.isEnableApplicationAccelerator
    return isDisabled
  }

  const disabledCookiesOptions = (option) => {
    const isDisabled =
      (option.value === 'whitelist' || option.value === 'blacklist' || option.value === 'all') &&
      !props.isEnableApplicationAccelerator
    return isDisabled
  }

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

  const cacheSettingsOptions = computed(() => {
    return CACHE_SETTINGS_OPTIONS.value.map((item) => {
      return {
        ...item,
        disabledItem: item.value === 'honor' && l2CachingEnabled.value
      }
    })
  })

  watch(adaptiveDeliveryAction, (value) => {
    if (value === 'whitelist' && deviceGroup.value.length === 0) {
      addDeviceGroup({ id: '' })
    }
  })

  watch(l2CachingEnabled, (value) => {
    if (value) {
      cdnCacheSettings.value = 'override'
      isSliceEdgeCachingEnabled.value = true
      sliceConfigurationEnabled.value = true
    } else {
      isSliceL2CachingEnabled.value = false
      isSliceEdgeCachingEnabled.value = false
    }
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
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Browser Cache Settings</label>
        <div class="flex flex-col gap-4">
          <div
            class="flex no-wrap gap-2 items-center"
            v-for="browserCacheSettingsOption in CACHE_SETTINGS_OPTIONS"
            :key="browserCacheSettingsOption.value"
          >
            <RadioButton
              v-model="browserCacheSettings"
              :inputId="`browserOption-${browserCacheSettingsOption.value}`"
              name="browserCacheSettings"
              :value="browserCacheSettingsOption.value"
            />
            <label
              :for="`browserOption-${browserCacheSettingsOption.value}`"
              class="text-color text-sm font-normal leading-tight"
            >
              {{ browserCacheSettingsOption.label }}
            </label>
          </div>
        </div>
        <small class="text-color-secondary text-xs font-normal leading-5">
          Honor cache policies from the origin or define a new maximum cache TTL for browsers.
        </small>
      </div>

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

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Edge Cache Settings</label>
        <div class="flex flex-col gap-4">
          <div
            class="flex no-wrap gap-2 items-center"
            v-for="cdnCacheSettingsOption in cacheSettingsOptions"
            :key="cdnCacheSettingsOption.value"
          >
            <RadioButton
              v-model="cdnCacheSettings"
              :inputId="`cdnOption-${cdnCacheSettingsOption.value}`"
              name="cdnCacheSettings"
              :disabled="cdnCacheSettingsOption.disabledItem"
              :value="cdnCacheSettingsOption.value"
            />
            <label
              :for="`cdnOption-${cdnCacheSettingsOption.value}`"
              class="text-color text-sm font-normal leading-tight"
            >
              {{ cdnCacheSettingsOption.label }}
            </label>
          </div>
        </div>
        <small class="text-color-secondary text-xs font-normal leading-5">
          Honor cache policies from the origin or define a new maximum cache TTL for the edge. If a
          TTL isn't received from the origin, cache will be maintained at a default TTL.
        </small>
      </div>
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
          :min="60"
          :max="31536000"
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
        <InputSwitch
          v-model="l2CachingEnabled"
          inputId="l2CachingEnabled"
        />
        <label
          for="l2CachingEnabled"
          class="flex flex-col items-start gap-1"
        >
          <span class="text-color text-sm font-normal leading-5">Tiered Cache </span>
          <span class="text-sm text-color-secondary font-normal leading-5">
            Enable Tiered Cache if you want to reduce the traffic to your origin and increase
            performance and availability.
          </span>
        </label>
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
      <div class="flex w-full gap-2 items-start">
        <InputSwitch
          v-model="sliceConfigurationEnabled"
          inputId="sliceConfigurationEnabled"
          :disabled="l2CachingEnabled"
        />
        <label
          for="sliceConfigurationEnabled"
          class="flex flex-col items-start gap-1"
        >
          <span class="text-color text-sm font-normal leading-5">Active </span>
        </label>
      </div>

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Layer</label>
        <div class="flex flex-col gap-4">
          <div class="flex w-full gap-2 items-start">
            <CheckboxPrime
              v-model="isSliceEdgeCachingEnabled"
              name="isSliceEdgeCachingEnabled"
              binary
              :disabled="l2CachingEnabled"
            />
            <label
              for="isSliceEdgeCachingEnabled"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5">Edge Cache</span>
            </label>
          </div>
          <div
            class="flex w-full gap-2 items-start"
            v-if="props.showTieredCache"
          >
            <CheckboxPrime
              v-model="isSliceL2CachingEnabled"
              name="isSliceL2CachingEnabled"
              binary
              :disabled="!l2CachingEnabled"
            />
            <label
              for="isSliceL2CachingEnabled"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5">Tiered Cache</span>
            </label>
          </div>
        </div>
      </div>
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
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Cache by Query String</label>
        <div class="flex flex-col gap-4">
          <div
            class="flex no-wrap gap-2 items-center"
            v-for="queryStringOption in QUERY_STRING_OPTIONS"
            :key="queryStringOption.value"
          >
            <RadioButton
              v-model="cacheByQueryString"
              :disabled="disabledQueryStringOptions(queryStringOption)"
              :inputId="queryStringOption.value"
              name="cacheByQueryString"
              :value="queryStringOption.value"
            />
            <label
              :for="queryStringOption.value"
              class="text-color text-sm font-normal leading-tight"
            >
              {{ queryStringOption.label }}
            </label>
          </div>
        </div>
      </div>
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

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Enable Settings</label>
        <div class="flex flex-col gap-4">
          <div class="flex w-full gap-2 items-start">
            <InputSwitch
              v-model="enableQueryStringSort"
              :disabled="!props.isEnableApplicationAccelerator"
              inputId="enableQueryStringSort"
            />
            <label
              for="enableQueryStringSort"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5">Query String Sort </span>
              <span class="text-sm text-color-secondary font-normal leading-5">
                Consider objects with the same query strings, regardless of the order of the fields,
                as the same cached file.
              </span>
            </label>
          </div>

          <Divider />
          <div class="flex w-full gap-2 items-start">
            <InputSwitch
              :disabled="!props.isEnableApplicationAccelerator"
              v-model="enableCachingForPost"
              inputId="enableCachingForPost"
            />
            <label
              for="enableCachingForPost"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5">Enable Caching for POST </span>
              <span class="text-sm text-color-secondary font-normal leading-5">
                Allow POST requests to be cached. The POST method will be included in the cache key.
              </span>
            </label>
          </div>

          <Divider />
          <div class="flex w-full gap-2 items-start">
            <InputSwitch
              v-model="enableCachingForOptions"
              :disabled="!props.isEnableApplicationAccelerator"
              inputId="enableCachingForOptions"
            />
            <label
              for="enableCachingForOptions"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5"
                >Enable Caching for OPTIONS
              </span>
              <span class="text-sm text-color-secondary font-normal leading-5">
                Allow OPTIONS requests to be cached. The OPTIONS method will be included in the
                cache key.
              </span>
            </label>
          </div>

          <Divider />
          <div class="flex w-full gap-2 items-start">
            <InputSwitch
              v-model="enableStaleCache"
              inputId="enableStaleCache"
              disabled
            />
            <label
              for="enableStaleCache"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5">Enable Stale Cache </span>
              <span class="text-sm text-color-secondary font-normal leading-5">
                Serve stale content from the cache if origin servers are unavailable.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Cache by Cookie</label>
        <div class="flex flex-col gap-4">
          <div
            class="flex no-wrap gap-2 items-center"
            v-for="cookiesOption in COOKIES_OPTIONS"
            :key="cookiesOption.value"
          >
            <RadioButton
              :disabled="disabledCookiesOptions(cookiesOption)"
              v-model="cacheByCookies"
              :inputId="cookiesOption.value"
              name="cacheByCookies"
              :value="cookiesOption.value"
            />
            <label
              :for="cookiesOption.value"
              class="text-color text-sm font-normal leading-tight"
            >
              {{ cookiesOption.label }}
            </label>
          </div>
        </div>
      </div>
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

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Adaptive Delivery</label>
        <div class="flex flex-col gap-4">
          <div
            class="flex no-wrap gap-2 items-center"
            v-for="deviceGroupCacheOption in DEVICE_GROUP_CACHE_OPTIONS"
            :key="deviceGroupCacheOption.value"
          >
            <RadioButton
              v-model="adaptiveDeliveryAction"
              :inputId="deviceGroupCacheOption.value"
              name="adaptiveDeliveryAction"
              :value="deviceGroupCacheOption.value"
            />
            <label
              :for="deviceGroupCacheOption.value"
              class="text-color text-sm font-normal leading-tight"
            >
              {{ deviceGroupCacheOption.label }}
            </label>
          </div>
        </div>
      </div>
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
