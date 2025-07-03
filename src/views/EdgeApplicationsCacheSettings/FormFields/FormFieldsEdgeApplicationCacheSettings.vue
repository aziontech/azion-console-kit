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
          label="Name"
          required
          placeholder="My cache setting"
          description="Give a unique and descriptive name to identify the cache setting."
          data-testid="edge-application-cache-settings-form__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <BrowserCache />

  <EdgeCache @enableSliceConfiguration="enableSliceConfiguration" />

  <TieredCache v-if="showTieredCacheForm" />

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
        data-testid="edge-application-cache-settings-form__cache-by-query-string-field"
      />

      <div
        v-if="showQueryFields"
        class="flex flex-col sm:max-w-lg w-full gap-2"
      >
        <FieldTextArea
          label="Query String Fields"
          required
          name="queryStringFields"
          :value="queryStringFields"
          placeholder="name"
          description="Separate query fields using line breaks."
          data-testid="edge-application-cache-settings-form__query-string-fields-field"
        />
      </div>

      <FieldGroupSwitch
        label="Enable Settings"
        :isCard="false"
        :options="advancedCacheSwitchOptions"
        data-testid="edge-application-cache-settings-form__advanced-cache-switch-field"
      />

      <FieldGroupRadio
        label="Cache by Cookie"
        nameField="cacheByCookies"
        :isCard="false"
        :options="cookieRadioOptions"
        data-testid="edge-application-cache-settings-form__cache-by-cookie-field"
      />

      <div
        v-if="showCookieNames"
        class="flex flex-col sm:max-w-lg w-full gap-2"
      >
        <FieldTextArea
          label="Cookie Names"
          required
          name="cookieNames"
          :value="cookieNames"
          placeholder="cookie_name"
          description="Separate cookies using line breaks."
          data-testid="edge-application-cache-settings-form__cookie-names-field"
        />
      </div>

      <FieldGroupRadio
        label="Adaptive Delivery"
        nameField="adaptiveDeliveryAction"
        :isCard="false"
        :options="adaptiveDeliveryRadioOptions"
        data-testid="edge-application-cache-settings-form__adaptive-delivery-field"
      />

      <div
        v-if="showDeviceGroupFields"
        class="flex flex-col w-full sm:max-w-3xl gap-2"
      >
        <LabelBlock
          label="Device Group ID"
          isRequired
        />
        <div class="flex flex-col gap-2 max-w-lg">
          <div
            v-for="(deviceGroupItem, index) in deviceGroup"
            :key="deviceGroupItem.key"
          >
            <FieldInputGroup
              placeholder="ID"
              :name="`deviceGroup[${index}].id`"
              :value="deviceGroup[index].value.id"
              :data-testid="`edge-application-cache-settings-form__device-group-id[${index}]-field`"
            >
              <template #button>
                <PrimeButton
                  v-if="!deviceGroupItem.isFirst"
                  icon="pi pi-trash"
                  size="small"
                  outlined
                  @click="removeDeviceGroup(index)"
                  :data-testid="`edge-application-cache-settings-form__remove-device-group-id[${index}]__button`"
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
            data-testid="edge-application-cache-settings-form__add-device-group__button"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'
  import { CDN_MAXIMUM_TTL_MAX_VALUE, CDN_MAXIMUM_TTL_MIN_VALUE } from '@/utils/constants'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import LabelBlock from '@/templates/label-block'

  // Form blocks
  import BrowserCache from './blocks/BrowserCache.vue'
  import EdgeCache from './blocks/EdgeCache.vue'
  import TieredCache from './blocks/TieredCache.vue'

  import { useField, useFieldArray } from 'vee-validate'
  import { computed, watch } from 'vue'

  const emit = defineEmits(['l2-caching-enabled'])

  const props = defineProps({
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
    },
    showTieredCache: {
      type: Boolean,
      required: true
    }
  })

  const { value: cdnCacheSettings } = useField('cdnCacheSettings')
  const { value: sliceConfigurationEnabled } = useField('sliceConfigurationEnabled')
  const { value: isSliceTieredCache } = useField('isSliceTieredCache')
  const { value: cacheByQueryString } = useField('cacheByQueryString')
  const { value: queryStringFields } = useField('queryStringFields')
  const { value: tieredCache } = useField('tieredCache')
  const { value: isSliceEdgeCachingEnabled } = useField('isSliceEdgeCachingEnabled')

  const { value: cacheByCookies } = useField('cacheByCookies')
  const { value: cookieNames } = useField('cookieNames')
  const { value: adaptiveDeliveryAction } = useField('adaptiveDeliveryAction')
  const {
    fields: deviceGroup,
    push: addDeviceGroup,
    remove: removeDeviceGroup
  } = useFieldArray('deviceGroup')

  const showCdnMaxTtl = computed(() => cdnCacheSettings.value === 'override')

  const showQueryFields = computed(() => {
    return ['whitelist', 'blacklist'].includes(cacheByQueryString.value)
  })
  const showCookieNames = computed(() => {
    return ['whitelist', 'blacklist'].includes(cacheByCookies.value)
  })
  const showDeviceGroupFields = computed(() => {
    return adaptiveDeliveryAction.value === 'whitelist'
  })

  const queryStringRadioOptions = [
    {
      title: 'Content does not vary by Query String (Improves Caching)',
      inputValue: 'ignore'
    },
    {
      title: 'Content varies by some Query String fields (Allowlist)',
      inputValue: 'whitelist',
      disabled: !props.isApplicationAcceleratorEnabled
    },
    {
      title: 'Content varies by Query String, except for some fields (Blocklist)',
      inputValue: 'blacklist',
      disabled: !props.isApplicationAcceleratorEnabled
    },
    {
      title: 'Content varies by all Query String fields',
      inputValue: 'all'
    }
  ]

  const cookieRadioOptions = [
    {
      title: 'Content does not vary by Cookies (Improves Caching)',
      inputValue: 'ignore'
    },
    {
      title: 'Content varies by some Cookies (Allowlist)',
      inputValue: 'whitelist',
      disabled: !props.isApplicationAcceleratorEnabled
    },
    {
      title: 'Content varies by Cookies, with the exception of a few (Blocklist)',
      inputValue: 'blacklist',
      disabled: !props.isApplicationAcceleratorEnabled
    },
    {
      title: 'Content varies by all Cookies',
      inputValue: 'all',
      disabled: !props.isApplicationAcceleratorEnabled
    }
  ]

  const adaptiveDeliveryRadioOptions = [
    {
      title: 'Content does not vary by Device Groups (Improves Caching)',
      inputValue: 'ignore'
    },
    {
      title: 'Content varies by some Device Groups (Allowlist)',
      inputValue: 'whitelist'
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

    if (props.isApplicationAcceleratorEnabled) {
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

  const enableSliceConfiguration = (isEnabled) => {
    console.log('isSliceTieredCache isEnabled :', isEnabled)
    isSliceEdgeCachingEnabled.value = isEnabled
    isSliceTieredCache.value = isEnabled
  }

  const showTieredCacheForm = computed(() => {
    return isSliceTieredCache.value && showTieredCache
  })

  watch(adaptiveDeliveryAction, (value) => {
    if (value === 'whitelist' && deviceGroup.value.length === 0) {
      addDeviceGroup({ id: '' })
    }
  })
</script>
