<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import InputNumber from 'primevue/inputnumber'
  import MultiSelect from 'primevue/multiselect'
  import PrimeTag from 'primevue/tag'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'
  import LabelBlock from '@/templates/label-block'

  import { useField } from 'vee-validate'
  import { computed } from 'vue'

  const props = defineProps({
    handleBlock: {
      type: Array,
      required: false,
      default: () => ['full']
    },
    contactSalesEdgeApplicationService: {
      type: Function
    }
  })

  const HTTP_PORT_LIST_OPTIONS = [
    { name: '80 (Default)', value: '80' },
    { name: '8008', value: '8008' },
    { name: '8080', value: '8080' }
  ]
  const HTTPS_PORT_LIST_OPTIONS = [
    { name: '443 (Default)', value: '443' },
    { name: '8443', value: '8443' },
    { name: '9440', value: '9440' },
    { name: '9441', value: '9441' },
    { name: '9442', value: '9442' },
    { name: '9443', value: '9443' }
  ]
  const TLS_VERSIONS_OPTIONS = [
    { label: 'None', value: 'none' },
    { label: 'TLS 1.0', value: 'tls_1_0' },
    { label: 'TLS 1.1', value: 'tls_1_1' },
    { label: 'TLS 1.2', value: 'tls_1_2' },
    { label: 'TLS 1.3', value: 'tls_1_3' }
  ]
  const SUPPORTED_CIPHERS_LIST_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'TLSv1.2_2018', value: 'TLSv1.2_2018' },
    { label: 'TLSv1.2_2019', value: 'TLSv1.2_2019' },
    { label: 'TLSv1.2_2021', value: 'TLSv1.2_2021' },
    { label: 'TLSv1.3_2022', value: 'TLSv1.3_2022' }
  ]
  const ORIGIN_TYPE_LIST_OPTIONS = [{ label: 'Single Origin', value: 'single_origin' }]

  const { value: deliveryProtocol } = useField('deliveryProtocol')
  const { value: http3 } = useField('http3')
  const { value: httpPort, errorMessage: httpPortError } = useField('httpPort')
  const { value: httpsPort, errorMessage: httpsPortError } = useField('httpsPort')
  const { value: minimumTlsVersion } = useField('minimumTlsVersion')
  const { value: supportedCiphers } = useField('supportedCiphers')
  const { value: originType } = useField('originType')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')
  const { value: browserCacheSettings } = useField('browserCacheSettings')

  const { value: name } = useField('name')
  const { value: address } = useField('address')
  const { value: hostHeader } = useField('hostHeader')
  const { value: browserCacheSettingsMaximumTtl } = useField('browserCacheSettingsMaximumTtl')
  const { value: cdnCacheSettingsMaximumTtl } = useField('cdnCacheSettingsMaximumTtl')

  const { value: websocket } = useField('websocket')

  const setDeliveryProtocol = (protocol) => {
    const enableHttp3 = protocol === 'http3'

    http3.value = enableHttp3
    if (deliveryProtocol.value === 'http') minimumTlsVersion.value = 'none'
    setDefaultHttpAndHttpsPort(enableHttp3)
  }

  const setDefaultHttpAndHttpsPort = (enableHttp3) => {
    if (enableHttp3) {
      httpPort.value = [HTTP_PORT_LIST_OPTIONS[0]]
      httpsPort.value = [HTTPS_PORT_LIST_OPTIONS[0]]
    }
  }

  const handleBlock = (block) => {
    const handle = props.handleBlock.some((value) => {
      return value === block
    })

    return handle
  }

  const usageProtocolRadioOptions = [
    {
      title: 'HTTP support',
      subtitle: `Use only the HTTP protocol. Choose from the available HTTP ports.`,
      inputValue: 'http'
    },
    {
      title: 'HTTP and HTTPS support',
      subtitle: `Use both HTTP and HTTPS protocols. Choose from the available HTTP and HTTPS ports.`,
      inputValue: 'http,https'
    },
    {
      title: 'HTTP/3 support',
      subtitle: `Use both HTTP and HTTPS protocols and enable HTTP/3 support. Only available for HTTP port 80 and HTTPS port 443.`,
      inputValue: 'http3'
    }
  ]

  const policyProtocolRadioOptions = [
    { title: 'Preserve HTTP/HTTPS', inputValue: 'preserve' },
    { title: 'Enforce HTTP', inputValue: 'http' },
    { title: 'Enforce HTTPS', inputValue: 'https' }
  ]

  const cacheSettingsRadioOptions = (type) => {
    const isBrowser = type === 'browser'

    const browserSubtitle =
      'Honor cache policies from the origin or define a new maximum cache TTL for browsers.'
    const cdnSubtitle = `Honor cache policies from the origin or define a new maximum cache TTL for the edge. If a TTL isn't received from the origin, cache will be maintained at a default TTL.`

    return [
      { title: 'Override cache settings', inputValue: 'override' },
      {
        title: 'Honor cache policies',
        subtitle: isBrowser ? browserSubtitle : cdnSubtitle,
        inputValue: 'honor'
      }
    ]
  }

  const checkIsProtocol = computed(() => ({
    http: deliveryProtocol.value === 'http',
    https: deliveryProtocol.value === 'http,https',
    http3: deliveryProtocol.value === 'http3'
  }))

  const isBrowserCacheTypeHonor = computed(() => browserCacheSettings.value === 'honor')
  const websocketIsEnabled = computed(() => websocket.value)
  const cdnCacheSettingsIsOverride = computed(() => cdnCacheSettings.value === 'override')

  const defaultModulesSwitchOptions = [
    {
      title: 'Application Accelerator',
      nameField: 'applicationAccelerator',
      subtitle: 'Optimize protocols and manage dynamic content delivery.'
    },
    {
      title: 'Edge Cache',
      nameField: 'caching',
      disabled: true,
      subtitle: 'Customize advanced cache settings.',
      tag: {
        value: 'Automatically enabled in all accounts.',
        icon: 'pi pi-lock'
      }
    },
    {
      title: 'Device Detection',
      nameField: 'deviceDetection',
      subtitle: 'Activate DeviceAtlas variables to configure responsive rules.'
    },
    {
      title: 'Edge Functions',
      nameField: 'edgeFunctions',
      subtitle: 'Build ultra-low latency functions that run on the edge.'
    },
    {
      title: 'Image Processor',
      nameField: 'imageOptimization',
      subtitle: 'Enable dynamic image editing options.'
    },
    {
      title: 'Load Balancer',
      nameField: 'loadBalancer',
      subtitle:
        'Balance traffic to your origins ensuring reliability and network congestion control.'
    }
  ]
  const subscriptionModulesSwitchOptions = [
    {
      title: 'Tiered Cache',
      nameField: 'l2Caching',
      subtitle: 'Enable an additional cache layer at the edge.'
    },
    {
      title: 'WebSocket Proxy',
      nameField: 'websocket',
      disabled: websocketIsEnabled.value,
      subtitle:
        'Enhance real-time data exchange between your edge application and backend services using the WebSocket protocol.'
    }
  ]
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create an edge application to deliver your content from the edge."
    v-if="handleBlock('general')"
    data-testid="form-horizontal-general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My edge application"
          :value="name"
          description="Give a unique and descriptive name to identify the edge application."
          data-testid="form-horizontal-general-name"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Delivery Settings"
    description="Choose the protocols used between the edge application and users."
    v-if="handleBlock('delivery-settings')"
    data-testid="form-horizontal-delivery-settings"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Protocol Usage"
        nameField="deliveryProtocol"
        :isCard="false"
        @onRadioChange="(option) => setDeliveryProtocol(option, false)"
        :options="usageProtocolRadioOptions"
        data-testid="form-horizontal-delivery-settings-protocol-usage"
      />

      <div class="flex gap-6 max-sm:flex-col">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-http"
            data-testid="form-horizontal-delivery-settings-http-ports-label"
            label="HTTP Ports"
            :isRequired="checkIsProtocol.http || checkIsProtocol.https"
          />
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              v-if="checkIsProtocol.http3"
              data-testid="form-horizontal-delivery-settings-http-ports-lock-icon"
            />
            <MultiSelect
              :options="HTTP_PORT_LIST_OPTIONS"
              v-model="httpPort"
              name="httpPort"
              filter
              autoFilterFocus
              optionLabel="name"
              :class="{ 'p-invalid': httpPortError }"
              placeholder="Select an HTTP port"
              class="w-full"
              display="chip"
              :disabled="checkIsProtocol.http3"
              :pt="{
                trigger: {
                  class: `${checkIsProtocol.http3 ? 'hidden' : ''}`
                }
              }"
              data-testid="form-horizontal-delivery-settings-http-ports-multi-select"
            />

            <small
              v-if="httpPortError"
              class="p-error text-xs font-normal leading-tight"
              data-testid="form-horizontal-delivery-settings-http-ports-error"
            >
              {{ httpPortError }}
            </small>
          </span>
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-https"
            data-testid="form-horizontal-delivery-settings-https-ports-label"
            label="HTTPS Ports"
            :isRequired="checkIsProtocol.https"
          />
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              v-if="!checkIsProtocol.https"
              data-testid="form-horizontal-delivery-settings-https-ports-lock-icon"
            />
            <MultiSelect
              :options="HTTPS_PORT_LIST_OPTIONS"
              v-model="httpsPort"
              name="httpsPort"
              optionLabel="name"
              display="chip"
              :class="{ 'p-invalid': httpsPortError }"
              placeholder="Select an HTTPS port"
              class="w-full"
              :disabled="checkIsProtocol.http || checkIsProtocol.http3"
              :pt="{
                trigger: {
                  class: `${checkIsProtocol.http || checkIsProtocol.http3 ? 'hidden' : ''}`
                }
              }"
              data-testid="form-horizontal-delivery-settings-https-ports-multi-select"
            />
            <small
              v-if="httpsPortError"
              class="p-error text-xs font-normal leading-tight"
              data-testid="form-horizontal-delivery-settings-https-ports-error"
            >
              {{ httpsPortError }}
            </small>
          </span>
        </div>
      </div>

      <div
        class="flex gap-6 max-sm:flex-col"
        v-if="checkIsProtocol.https || checkIsProtocol.http3"
        data-testid="form-horizontal-delivery-settings-tls-ciphers"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            data-testid="form-horizontal-delivery-settings-tls-version-field-dropdown"
            label="Minimum TLS version"
            name="minimumTlsVersion"
            :options="TLS_VERSIONS_OPTIONS"
            optionLabel="label"
            optionValue="value"
            :value="minimumTlsVersion"
            inputId="minimumTlsVersion"
            placeholder="Select a minimum TLS Version"
            :disabled="checkIsProtocol.http"
            description="Enable HTTP and HTTPS protocols to configure the minimum TLS version the application supports."
          />
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            data-testid="form-horizontal-delivery-settings-cipher-suite-field-dropdown"
            label="Cipher suite"
            name="supportedCiphers"
            :options="SUPPORTED_CIPHERS_LIST_OPTIONS"
            optionLabel="label"
            optionValue="value"
            :value="supportedCiphers"
            inputId="supportedCiphers"
            placeholder="Select the supported cipher suite"
            :disabled="checkIsProtocol.http"
            description="Select which cipher suite the application supports. See the list of supported ciphers in the documentation."
          />
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Default Origin"
    description="Customize settings related to origin servers and hosts."
    v-if="handleBlock('default-origins')"
    data-testid="form-horizontal-default-origin"
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <LabelBlock
          for="origin-type"
          data-testid="form-horizontal-default-origin-type-label"
          label="Type"
          isRequired
        />
        <span class="p-input-icon-right">
          <i class="pi pi-lock text-[var(--text-color-secondary)]" />
          <Dropdown
            appendTo="self"
            :options="ORIGIN_TYPE_LIST_OPTIONS"
            v-model="originType"
            optionLabel="label"
            optionValue="value"
            placeholder="Select an origin type"
            disabled
            class="w-full"
            :pt="{
              trigger: {
                class: 'hidden'
              }
            }"
            data-testid="form-horizontal-default-origin-type-dropdown"
          />
        </span>
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="form-horizontal-default-origin-type-description"
        >
          The origin type is pre-defined and can't be customized.
        </small>
      </div>

      <FieldGroupRadio
        label="Protocol Policy"
        nameField="originProtocolPolicy"
        :isCard="false"
        :options="policyProtocolRadioOptions"
        helpText="Select the protocol usage between the edge nodes and the origin."
        data-testid="form-horizontal-default-origin-protocol-policy"
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="form-horizontal-default-origin-address-field-text"
          label="Address"
          required
          name="address"
          aria-describedby="address-help"
          placeholder="example.com"
          :value="address"
          description="Define an origin for the content in FQDN format or an IPv4/IPv6 address."
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="form-horizontal-default-origin-host-header-field-text"
          label="Host Header"
          required
          name="hostHeader"
          aria-describedby="hostHeader-help"
          placeholder="${host}"
          :value="hostHeader"
          description="Identify a virtualhost sent in the Host header to the origin."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Cache Expiration Policies"
    description="Define how the edge should handle TTL values sent by the origin as well as how long your content should remain cached at the edge."
    v-if="handleBlock('cache-expiration-policies')"
    data-testid="form-horizontal-cache-expiration-policies"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Browser Cache Settings"
        nameField="browserCacheSettings"
        :isCard="false"
        :options="cacheSettingsRadioOptions('browser')"
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
            v-model="browserCacheSettingsMaximumTtl"
            showButtons
            data-testid="form-horizontal-cache-expiration-policies-browser-cache-settings-maximum-ttl-input"
          />
        </div>
      </div>

      <FieldGroupRadio
        label="Edge Cache Settings"
        nameField="cdnCacheSettings"
        :isCard="false"
        :options="cacheSettingsRadioOptions('cdn')"
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
            v-model="cdnCacheSettingsMaximumTtl"
            showButtons
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

  <FormHorizontal
    title="Modules"
    description="Activate modules to extend the configuration possibilities of the application. Some modules require subscription."
    v-if="handleBlock('edge-application-modules')"
    data-testid="form-horizontal-modules"
  >
    <template #inputs>
      <div
        class="flex flex-col gap-2"
        data-testid="form-horizontal-modules-default"
      >
        <FieldGroupSwitch
          label="Default Modules"
          isCard
          :options="defaultModulesSwitchOptions"
          data-testid="form-horizontal-modules-default-switch"
        >
          <template #footer="{ item }">
            <PrimeTag
              v-if="item?.tag"
              :value="item.tag.value"
              :icon="item.tag.icon"
              severity="info"
              class="mt-3"
              data-testid="form-horizontal-modules-default-switch-tag"
            />
          </template>
        </FieldGroupSwitch>
      </div>

      <div
        class="flex flex-col gap-2"
        data-testid="form-horizontal-modules-subscription"
      >
        <FieldGroupSwitch
          label="Subscription modules"
          isCard
          :options="subscriptionModulesSwitchOptions"
          data-testid="form-horizontal-modules-subscription-switch"
        />
        <PrimeButton
          outlined
          icon="pi pi-shopping-cart"
          class="max-w-[150px]"
          label="Contact sales"
          @click="props.contactSalesEdgeApplicationService()"
          data-testid="form-horizontal-modules-subscription-contact-sales-button"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Debug Rules"
    description="Log executed rules created in Rules Engine. Query logs using Data Stream, Real-Time Events, or Real-Time Events GraphQL API."
    v-if="handleBlock('debug-rules')"
    data-testid="form-horizontal-debug-rules"
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="debugRules"
          name="debugRules"
          auto
          :isCard="false"
          title="Active"
          subtitle="Rules that were successfully executed will be shown under the $traceback field in Data
              Streaming and Real-Time Events or the $stacktrace variable in GraphQL."
          data-testid="form-horizontal-debug-rules-switch"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
