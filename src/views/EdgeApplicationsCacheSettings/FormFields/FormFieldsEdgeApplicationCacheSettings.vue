<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import TextArea from 'primevue/textarea'
  import { useField, useFieldArray } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const CACHE_SETTINGS_OPTIONS = ref([
    {
      label: 'Override Cache Settings',
      value: 'override'
    },
    {
      label: 'Honor Origin Cache Headers',
      value: 'honor'
    }
  ])
  const DEVICE_GROUP_CACHE_OPTIONS = ref([
    {
      label: 'Content does not vary by Device Groups (Improves Caching)',
      value: 'ignore'
    },
    {
      label: 'Content varies by some Device Groups fields (Whitelist)',
      value: 'whitelist'
    }
  ])

  const QUERY_STRING_OPTIONS = ref([
    {
      label: 'Content does not vary by Query String (Improves Caching)',
      value: 'ignore'
    },
    {
      label: 'Content varies by some Query String fields (Whitelist)',
      value: 'whitelist'
    },
    {
      label: 'Content varies by Query String, except for some fields (Blacklist)',
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
      label: 'Content varies by some Cookies (Whitelist)',
      value: 'whitelist'
    },
    {
      label: 'Content varies by Cookies, with the exception of a few (Blacklist)',
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
  const { value: cacheByQueryString } = useField('cacheByQueryString')
  const { value: queryStringFields, errorMessage: queryStringFieldsError } =
    useField('queryStringFields')

  const { value: enableQueryStringSort } = useField('enableQueryStringSort')
  const { value: enableCachingForPost } = useField('enableCachingForPost')
  const { value: enableCachingForOptions } = useField('enableCachingForOptions')
  const { value: enableStaleCache } = useField('enableStaleCache')

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

  watch(adaptiveDeliveryAction, (value) => {
    if (value === 'whitelist' && deviceGroup.value.length === 0) {
      addDeviceGroup({ id: '' })
    }
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Edit the cache setting title and description."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          name="name"
          label="Name *"
          description="Give a unique and descriptive name to identify the origin."
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
            v-for="cdnCacheSettingsOption in CACHE_SETTINGS_OPTIONS"
            :key="cdnCacheSettingsOption.value"
          >
            <RadioButton
              v-model="cdnCacheSettings"
              :inputId="`cdnOption-${cdnCacheSettingsOption.value}`"
              name="cdnCacheSettings"
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
        <small class="text-color-secondary text-sm font-normal leading-tight">
          TTL for CDN cache should be equal to or greater than 60 seconds. To use a lower value, you
          need to enable Application Acceleration on the Main Settings tab. To enable L2 Caching,
          the TTL for CDN cache should be equal to or greater than 3 seconds.
        </small>
        <small
          v-if="cdnCacheSettingsMaximumTtlError"
          class="p-error text-xs font-normal leading-tight"
          >{{ cdnCacheSettingsMaximumTtlError }}</small
        >
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="File Slicing"
    description="Slice Configuration is a feature that enables the use of byte-range requests. When you apply the Slice Configuration on your upstream, instead of download a large content file, use it to split your file in pieces and cache the content on-demand."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex w-full gap-2 items-start">
        <InputSwitch
          v-model="sliceConfigurationEnabled"
          inputId="sliceConfigurationEnabled"
        />
        <label
          for="sliceConfigurationEnabled"
          class="flex flex-col items-start gap-1"
        >
          <span class="text-color text-sm font-normal leading-5">Active </span>
          <span class="text-sm text-color-secondary font-normal leading-5">
            Enable file slicing to break large files into smaller fragments that can be cached at
            the edge.
          </span>
        </label>
      </div>

      <div
        v-if="showSliceConfigurationRange"
        class="flex flex-col sm:max-w-xs w-full gap-2"
      >
        <label
          for="sliceConfigurationRange"
          class="text-color text-sm font-medium"
          >Slice Range (KB)</label
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

        <small class="text-color-secondary text-sm font-normal leading-tight">
          Slice range is used to define a range in Bytes to slice a big file in small pieces
          (byte-ranges)
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
          >Query String fields *</label
        >
        <TextArea
          id="queryStringFields"
          v-model="queryStringFields"
          :class="{ 'p-invalid': queryStringFieldsError }"
          rows="5"
          cols="30"
        />
        <small class="text-color-secondary text-sm font-normal leading-tight">
          Separate fields by adding new lines.
        </small>
        <small class="p-error">{{ queryStringFieldsError }}</small>
      </div>

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5">Enable Settings</label>
        <div class="flex flex-col gap-4">
          <div class="flex w-full gap-2 items-start">
            <InputSwitch
              v-model="enableQueryStringSort"
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
              v-model="enableCachingForPost"
              inputId="enableCachingForPost"
            />
            <label
              for="enableCachingForPost"
              class="flex flex-col items-start gap-1"
            >
              <span class="text-color text-sm font-normal leading-5">Enable Caching for POST </span>
              <span class="text-sm text-color-secondary font-normal leading-5">
                Allow POST requests to generate cache. The POST method will be included in the cache
                key.
              </span>
            </label>
          </div>

          <Divider />
          <div class="flex w-full gap-2 items-start">
            <InputSwitch
              v-model="enableCachingForOptions"
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
                Allow OPTIONS requests to generate cache. The OPTIONS method will be included in the
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
                Serve stale content from the cache if the origin servers are unavailable.
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
        />
        <small class="text-color-secondary text-sm font-normal leading-tight">
          Separate fields by adding new lines.
        </small>
        <small class="p-error">{{ cookieNamesError }}</small>
      </div>

      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label class="text-color text-sm font-medium leading-5"
          >Add Device Groups to your Cache Settings</label
        >
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
        <label class="text-color text-sm font-medium leading-5"
          >Add Device Groups to your Cache Settings</label
        >
        <div class="flex flex-col gap-2 max-w-lg">
          <div
            v-for="(deviceGroupItem, index) in deviceGroup"
            :key="deviceGroupItem.key"
          >
            <FieldInputGroup
              placeholder="Value"
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
            label="Add Device"
            icon="pi pi-plus-circle"
            class="w-fit"
            @click="addDeviceGroup({ id: '' })"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
