<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import MultiSelect from 'primevue/multiselect'
  import LabelBlock from '@/templates/label-block'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import InputText from 'primevue/inputtext'
  import PrimeTag from 'primevue/tag'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'
  import DigitalCertificatesDrawer from '@/views/DigitalCertificates/Drawer'

  const props = defineProps({
    digitalCertificates: {
      type: Array,
      required: true
    },
    hasDomainName: {
      type: Boolean,
      required: false,
      default: false
    },
    listDigitalCertificatesService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
      type: Function,
      required: true
    }
  })

  const EDGE_CERTIFICATE = 'edge_certificate'
  const TRUSTED_CA_CERTIFICATE = 'trusted_ca_certificate'

  const { value: name } = useField('name')
  const { value: cnames } = useField('cnames')
  const { value: cnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
  const { value: environment } = useField('environment')
  const { value: domainName } = useField('domainName')
  const { value: deliveryProtocol } = useField('deliveryProtocol')
  const { value: useHttps } = useField('useHttps')
  const { value: useHttp3 } = useField('useHttp3')
  const { value: httpPort, errorMessage: httpPortError } = useField('httpPort')
  const { value: httpsPort, errorMessage: httpsPortError } = useField('httpsPort')
  const { value: quicPort, errorMessage: quicPortError } = useField('quicPort')
  const { value: minimumTlsVersion } = useField('minimumTlsVersion')
  const { value: supportedCiphers } = useField('supportedCiphers')

  const { value: mtlsTrustedCertificate } = useField('mtlsTrustedCertificate')

  const HTTP_PORT_LIST_OPTIONS = [
    { name: '80 (Default)', value: 80 },
    { name: '8008', value: 8008 },
    { name: '8080', value: 8080 },
    // Custom Ports
    { name: '8880', value: 8880 }
  ]
  const HTTP3_PORT_LIST_OPTIONS = [{ name: '443 (Default)', value: 443 }]
  const HTTPS_PORT_LIST_OPTIONS = [
    { name: '443 (Default)', value: 443 },
    { name: '8443', value: 8443 },
    { name: '9440', value: 9440 },
    { name: '9441', value: 9441 },
    { name: '9442', value: 9442 },
    { name: '9443', value: 9443 },
    // Custom Ports
    { name: '7777', value: 7777 },
    { name: '8888', value: 8888 },
    { name: '9553', value: 9553 },
    { name: '9653', value: 9653 },
    { name: '8035', value: 8035 },
    { name: '8090', value: 8090 }
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

  const mtlsModeRadioOptions = ref([
    {
      title: 'Enforce',
      subtitle: `Blocks the client certificate during the TLS handshake if the uploaded Trusted CA can't be validated.`,
      inputValue: 'enforce'
    },
    {
      title: 'Permissive',
      subtitle: `Attempts to verify the client certificate, but will allow the TLS handshake even if
              the Trusted CA can't be validated. Check which client certificate attempted the
              request in Edge Firewall, if necessary.`,
      inputValue: 'permissive'
    }
  ])

  const environmentOptions = computed(() => {
    const tag = {
      value: 'The environment type cannot be changed after the domain is created',
      icon: 'pi pi-lock'
    }
    const environmentOptionsRadios = [
      {
        title: 'Global Edge Network',
        inputValue: '1',
        disabled: true
      },
      {
        title: 'Staging Network',
        inputValue: '2',
        disabled: true
      }
    ]

    if (environment.value === '1') {
      environmentOptionsRadios[0].tag = tag
    } else if (environment.value === 'preview') {
      environmentOptionsRadios[1].tag = tag
    }

    return environmentOptionsRadios
  })

  const handleHttps = (value) => {
    if (value) {
      useHttps.value = value
    }
  }

  const checkIsProtocol = computed(() => ({
    https: deliveryProtocol.value === 'https',
    http3: deliveryProtocol.value === 'http3'
  }))

  const showTlsAndCipherDropdown = computed(() => useHttps.value || useHttp3.value)

  watch(useHttp3, (newValue) => {
    if (newValue) {
      quicPort.value = HTTP3_PORT_LIST_OPTIONS
    }
  })

  const digitalCertificateDrawerRef = ref('')
  const openDigitalCertificateDrawer = () => {
    digitalCertificateDrawerRef.value.openCreateDrawer()
  }

  const onDigitalCertificateSuccess = (id) => {
    edgeCertificate.value = id
  }

  const listDigitalCertificatesByEdgeCertificateTypeDecorator = async (queryParams) => {
    return await props.listDigitalCertificatesService({
      type: EDGE_CERTIFICATE,
      fields: ['id,name'],
      ...queryParams
    })
  }

  const listDigitalCertificatesByTrustedCaCertificateTypeDecorator = async (queryParams) => {
    return await props.listDigitalCertificatesService({
      type: TRUSTED_CA_CERTIFICATE,
      fields: ['id,name'],
      ...queryParams
    })
  }
</script>

<template>
  <form-horizontal
    title="General"
    description="Check the details of the Azion domain, including the domain address to access the application, and modify digital certificate options."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My domain"
          :value="name"
          description="Give a unique and descriptive name to identify the domain."
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Environment Type"
    description="Select Global Edge Network to set this as a production domain or select Staging Network for a testing domain that won’t affect your production environment"
  >
    <template #inputs>
      <div class="flex flex-col gap-3">
        <FieldGroupRadio
          isCard
          nameField="environment"
          :options="environmentOptions"
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
        </FieldGroupRadio>
      </div>
    </template>
  </form-horizontal>

  <FormHorizontal
    title="Delivery Settings"
    description="Choose the protocols used between the edge application and users."
    data-testid="form-horizontal-delivery-settings"
  >
    <template #inputs>
      <div class="flex gap-6 max-sm:flex-col">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-http"
            data-testid="form-horizontal-delivery-settings-http-ports-label"
            label="HTTP Ports"
            isRequired
          />
          <span class="p-input-icon-right">
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
      </div>
      <div class="flex gap-6 max-sm:flex-col">
        <FieldSwitchBlock
          data-testid="domains-form__use-https-field"
          nameField="useHttps"
          name="useHttps"
          auto
          :isCard="false"
          :disabled="useHttp3"
          title="HTTPS support"
          subtitle="Use both HTTP and HTTPS protocols. Choose from the available HTTP and HTTPS ports."
        />
      </div>
      <div
        class="flex gap-6 max-sm:flex-col"
        v-if="useHttps"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-https"
            data-testid="form-horizontal-delivery-settings-https-ports-label"
            label="HTTPS Ports"
            :isRequired="useHttps"
          />
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              v-if="!useHttps"
              data-testid="form-horizontal-delivery-settings-https-ports-lock-icon"
            />
            <MultiSelect
              :options="HTTPS_PORT_LIST_OPTIONS"
              v-model="httpsPort"
              name="httpsPort"
              filter
              autoFilterFocus
              optionLabel="name"
              display="chip"
              :class="{ 'p-invalid': httpsPortError }"
              placeholder="Select an HTTPS port"
              class="w-full"
              :disabled="!useHttps"
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
        v-if="showTlsAndCipherDropdown"
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
      <div class="flex gap-6 max-sm:flex-col">
        <FieldSwitchBlock
          data-testid="domains-form__use-http3-field"
          nameField="useHttp3"
          name="useHttp3"
          auto
          @onSwitchChange="handleHttps"
          :isCard="false"
          title="HTTP/3 support"
          subtitle="Enable HTTP/3 support. Only available for HTTP port 80 and HTTPS port 443."
        />
      </div>
      <div
        class="flex gap-6 max-sm:flex-col"
        v-if="useHttp3"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-https"
            data-testid="form-horizontal-delivery-settings-https-port3-label"
            label="HTTP3 Port"
            isRequired
          />
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              data-testid="form-horizontal-delivery-settings-https-ports-lock-icon"
            />
            <MultiSelect
              :options="HTTP3_PORT_LIST_OPTIONS"
              v-model="quicPort"
              name="quicPort"
              filter
              autoFilterFocus
              optionLabel="name"
              display="chip"
              :class="{ 'p-invalid': quicPortError }"
              placeholder="Select an HTTPS port"
              class="w-full"
              disabled
              :pt="{
                trigger: {
                  class: 'hidden'
                }
              }"
              data-testid="form-horizontal-delivery-settings-http3-ports-multi-select"
            />
            <small
              v-if="quicPortError"
              class="p-error text-xs font-normal leading-tight"
              data-testid="form-horizontal-delivery-settings-https-ports-error"
            >
              {{ quicPortError }}
            </small>
          </span>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <form-horizontal
    title="Domain"
    description="The domain URL attributed by Azion."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <label
          for="domainName"
          class="text-color text-base font-medium"
        >
          Domain
        </label>
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock" />
            <InputText
              id="domainName"
              data-testid="edit-domains-form__domain-field__input"
              v-model="domainName"
              type="text"
              class="flex flex-col w-full"
              :feedback="false"
              disabled
            />
          </span>
          <PrimeButton
            icon="pi pi-clone"
            outlined
            data-testid="edit-domains-form__domain-field__copy-button"
            type="button"
            aria-label="Copy to Clipboard"
            label="Copy to Clipboard"
            :disabled="!props.hasDomainName"
            @click="$emit('copyDomainName', { name: domainName })"
          />
        </div>
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Settings"
    description="Determine the edge application of the domain and its digital certificate. To link an existing domain to an application, add it to the CNAME field and block access to the application via the Azion domain."
  >
    <template #inputs>
      <DigitalCertificatesDrawer
        ref="digitalCertificateDrawerRef"
        @onSuccess="onDigitalCertificateSuccess"
      />

      <FieldSwitchBlock
        nameField="cnameAccessOnly"
        name="cnameAccessOnly"
        auto
        :isCard="false"
        title="CNAME Access Only"
        subtitle="Check this option to make the application accessible only through the domains listed in the CNAME field. Attempts to access the application through the Azion domain will be blocked."
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="CNAME"
          data-testid="domains-form__cnames-field"
          :required="cnameAccessOnly"
          name="cnames"
          rows="2"
          :value="cnames"
          description="List of CNAMEs to associate to the Azion domain. Separate each entry in a new line."
        />
      </div>

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          label="Digital Certificate"
          name="edgeCertificate"
          data-testid="domains-form__digital-certificates-field"
          :service="listDigitalCertificatesByEdgeCertificateTypeDecorator"
          :loadService="loadDigitalCertificatesService"
          optionLabel="name"
          optionValue="value"
          :value="edgeCertificate"
          appendTo="self"
          placeholder="Select a certificate"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDigitalCertificateDrawer"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-digital-certificate-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Digital Certificate"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="mtlsIsEnabled"
        name="mtlsIsEnabled"
        auto
        :isCard="false"
        title="Mutual Authentication"
      />

      <div v-show="mtlsIsEnabled">
        <div class="flex flex-col gap-3">
          <FieldGroupRadio
            nameField="mtlsVerification"
            :isCard="true"
            label="Mode"
            :options="mtlsModeRadioOptions"
          />
        </div>
      </div>

      <div
        v-if="mtlsIsEnabled"
        class="flex flex-col w-full sm:max-w-xs gap-2"
      >
        <FieldDropdownLazyLoader
          label="Trusted CA Certificate"
          required
          name="mtlsTrustedCertificate"
          :service="listDigitalCertificatesByTrustedCaCertificateTypeDecorator"
          :loadService="loadDigitalCertificatesService"
          :disabled="!mtlsIsEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtlsTrustedCertificate"
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate. Go to Digital Certificates to upload one."
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="edit-domains-form__active-field"
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
