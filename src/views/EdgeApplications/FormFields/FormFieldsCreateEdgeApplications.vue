<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
  import InputText from 'primevue/inputtext'
  import MultiSelect from 'primevue/multiselect'
  import PrimeTag from 'primevue/tag'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'

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
  const { value: httpPort } = useField('httpPort')
  const { value: httpsPort } = useField('httpsPort')
  const { value: minimumTlsVersion } = useField('minimumTlsVersion')
  const { value: supportedCiphers } = useField('supportedCiphers')
  const { value: originType } = useField('originType')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')
  const { value: browserCacheSettings } = useField('browserCacheSettings')
  useField('originProtocolPolicy')
  useField('debugRules')

  const { value: name } = useField('name')
  const { value: address, errorMessage: addressError } = useField('address')
  const { value: hostHeader, errorMessage: hostHeaderError } = useField('hostHeader')
  const { value: browserCacheSettingsMaximumTtl } = useField('browserCacheSettingsMaximumTtl')
  const { value: cdnCacheSettingsMaximumTtl } = useField('cdnCacheSettingsMaximumTtl')

  const { value: websocket } = useField('websocket')
  useField('applicationAccelerator')
  useField('caching')
  useField('deviceDetection')
  useField('edgeFunctions')
  useField('imageOptimization')
  useField('l2Caching')
  useField('loadBalancer')

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
      value: 'http'
    },
    {
      title: 'HTTP and HTTPS support',
      subtitle: `Use both HTTP and HTTPS protocols. Choose from the available HTTP and HTTPS ports.`,
      value: 'http,https'
    },
    {
      title: 'HTTP/3 support',
      subtitle: `Use both HTTP and HTTPS protocols and enable HTTP/3 support. Only available for HTTP port 80 and HTTPS port 443.`,
      value: 'http3'
    }
  ]

  const policyProtocolRadioOptions = [
    { title: 'Preserve HTTP/HTTPS', value: 'preserve' },
    { title: 'Enforce HTTP', value: 'http' },
    { title: 'Enforce HTTPS', value: 'https' }
  ]

  const cacheSettingsRadioOptions = (type) => {
    const isBrowser = type === 'browser'

    const browserSubtitle = 'Honor cache policies from the origin or define a new maximum cache TTL for browsers.'
    const cdnSubtitle = `Honor cache policies from the origin or define a new maximum cache TTL for the edge. If a TTL isn't received from the origin, cache will be maintained at a default TTL.`

    return [
      { title: 'Override cache settings', value: 'override' },
      {
        title: 'Honor cache policies',
        subtitle: isBrowser ? browserSubtitle : cdnSubtitle,
        value: 'honor'
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
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          placeholder="My edge application"
          :value="name"
          description="Give a unique and descriptive name to identify the edge application."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Delivery Settings"
    description="Choose the protocols used between the edge application and users."
    v-if="handleBlock('delivery-settings')"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Protocol Usage"
        nameField="deliveryProtocol"
        :isCard="false"
        @onRadioChange="(option) => setDeliveryProtocol(option, false)"
        :options="usageProtocolRadioOptions"
      />

      <div class="flex gap-6 max-sm:flex-col">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="port-http"
            class="text-color text-base font-medium"
            >HTTP Ports <span v-if="checkIsProtocol.http || checkIsProtocol.https">*</span></label
          >
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              v-if="checkIsProtocol.http3"
            />
            <MultiSelect
              :options="HTTP_PORT_LIST_OPTIONS"
              v-model="httpPort"
              filter
              optionLabel="name"
              placeholder="Select an HTTP port"
              class="w-full"
              display="chip"
              :disabled="checkIsProtocol.http3"
              :pt="{
                trigger: {
                  class: `${checkIsProtocol.http3 ? 'hidden' : ''}`
                }
              }"
            />
          </span>
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="port-https"
            class="text-color text-base font-medium"
            >HTTPS Ports <span v-if="checkIsProtocol.https">*</span></label
          >
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              v-if="!checkIsProtocol.https"
            />
            <MultiSelect
              :options="HTTPS_PORT_LIST_OPTIONS"
              v-model="httpsPort"
              optionLabel="name"
              display="chip"
              placeholder="Select an HTTPS port"
              class="w-full"
              :disabled="checkIsProtocol.http || checkIsProtocol.http3"
              :pt="{
                trigger: {
                  class: `${checkIsProtocol.http || checkIsProtocol.http3 ? 'hidden' : ''}`
                }
              }"
            />
          </span>
        </div>
      </div>

      <div
        class="flex gap-6 max-sm:flex-col"
        v-if="checkIsProtocol.https || checkIsProtocol.http3"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="tls-version"
            class="text-color text-base font-medium"
            >Minimum TLS version</label
          >
          <Dropdown
            appendTo="self"
            :options="TLS_VERSIONS_OPTIONS"
            v-model="minimumTlsVersion"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a minimum TLS Version"
            :disabled="checkIsProtocol.http"
          />

          <small class="text-xs text-color-secondary font-normal leading-5">
            Enable HTTP and HTTPS protocols to configure the minimum TLS version the application
            supports.
          </small>
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="ciphers-list"
            class="text-color text-base font-medium"
            >Cipher suite</label
          >
          <Dropdown
            appendTo="self"
            :options="SUPPORTED_CIPHERS_LIST_OPTIONS"
            v-model="supportedCiphers"
            optionLabel="label"
            optionValue="value"
            placeholder="Select the supported cipher suite"
            :disabled="checkIsProtocol.http"
          />

          <small class="text-xs text-color-secondary font-normal leading-5">
            Select which cipher suite the application supports. See the list of supported ciphers in
            the documentation.
          </small>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Default Origin"
    description="Customize settings related to origin servers and hosts."
    v-if="handleBlock('default-origins')"
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="origin-type"
          class="text-color text-base font-medium"
          >Type *</label
        >
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
          />
        </span>
        <small class="text-xs text-color-secondary font-normal leading-5">
          The origin type is pre-defined and can't be customized.
        </small>
      </div>

      <FieldGroupRadio
        label="Protocol Policy"
        nameField="originProtocolPolicy"
        :isCard="false"
        :options="policyProtocolRadioOptions"
        helpText="Select the protocol usage between the edge nodes and the origin."
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="address"
          class="text-color text-base font-medium"
          >Address *</label
        >
        <InputText
          id="address"
          v-model="address"
          :class="{ 'p-invalid': addressError }"
          aria-describedby="address-help"
          placeholder="example.com"
        />
        <div class="text-color-secondary text-sm font-normal">
          Define an origin for the content in FQDN format or an IPv4/IPv6 address.
        </div>
        <small
          v-if="addressError"
          class="p-error text-xs font-normal leading-tight"
          >{{ addressError }}</small
        >
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="host-header"
          class="text-color text-base font-medium"
          >Host Header *</label
        >
        <InputText
          id="hostHeader"
          v-model="hostHeader"
          :class="{ 'p-invalid': hostHeaderError }"
          aria-describedby="hostHeader-help"
          placeholder="${host}"
        />
        <div class="text-color-secondary text-sm font-normal">
          Identify a virtualhost sent in the Host header to the origin.
        </div>
        <small
          v-if="hostHeaderError"
          class="p-error text-xs font-normal leading-tight"
          >{{ hostHeaderError }}</small
        >
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Cache Expiration Policies"
    description="Define how the edge should handle TTL values sent by the origin as well as how long your content should remain cached at the edge."
    v-if="handleBlock('cache-expiration-policies')"
  >
    <template #inputs>
      <FieldGroupRadio
        label="Browser Cache Settings"
        nameField="browserCacheSettings"
        :isCard="false"
        :options="cacheSettingsRadioOptions('browser')"
      />

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="!isBrowserCacheTypeHonor"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="maximun-ttl-seconds"
            class="text-color text-base font-medium"
            >Maximum TTL (seconds)</label
          >

          <InputNumber
            v-model="browserCacheSettingsMaximumTtl"
            showButtons
          />
        </div>
      </div>

      <FieldGroupRadio
        label="Edge Cache Settings"
        nameField="cdnCacheSettings"
        :isCard="false"
        :options="cacheSettingsRadioOptions('cdn')"
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="cdn-maximun-ttl-seconds"
            class="text-color text-base font-medium"
            >{{ cdnCacheSettingsIsOverride ? 'Maximum TTL (seconds)' : 'Default TTL' }}</label
          >

          <InputNumber
            v-model="cdnCacheSettingsMaximumTtl"
            showButtons
          />

          <div class="text-color-secondary text-sm font-normal">
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
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldGroupSwitch
          label="Default Modules"
          isCard
          :options="defaultModulesSwitchOptions"
        >
          <template #footer="{ item }">
            <PrimeTag
              v-if="item?.tag"
              :value="item.tag.value"
              :icon="item.tag.icon"
              severity="info"
              class="mt-3"
            />
          </template>
        </FieldGroupSwitch>
      </div>

      <div class="flex flex-col gap-2">
        <FieldGroupSwitch
          label="Subscription modules"
          isCard
          :options="subscriptionModulesSwitchOptions"
        />
        <PrimeButton
          outlined
          icon="pi pi-shopping-cart"
          class="max-w-[150px]"
          label="Contact sales"
          @click="props.contactSalesEdgeApplicationService()"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Debug Rules"
    description="Log executed rules created in Rules Engine. Query logs using Data Stream, Real-Time Events, or Real-Time Events GraphQL API."
    v-if="handleBlock('debug-rules')"
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
        />
      </div>
    </template>
  </FormHorizontal>
</template>
