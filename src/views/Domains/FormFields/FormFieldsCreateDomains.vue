<script setup>
  import {
    EDGE_CERTIFICATE,
    TRUSTED_CA_CERTIFICATE
  } from '@/services/digital-certificates-services'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Drawer from '@/views/EdgeApplications/Drawer'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import DigitalCertificatesDrawer from '@/views/DigitalCertificates/Drawer'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import DrawerEdgeFirewall from '@/views/EdgeFirewall/Drawer'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const props = defineProps({
    digitalCertificates: {
      type: Array,
      required: true
    },
    listEdgeApplicationsService: {
      type: Function,
      required: true
    },
    loadEdgeApplicationsService: {
      type: Function,
      required: true
    },
    edgeFirewallsData: {
      type: Array,
      required: true
    },
    isLoadingEdgeFirewalls: {
      type: Boolean,
      required: true
    },
    hasDomainName: {
      type: Boolean,
      required: false,
      default: false
    },
    isLoadingRequests: {
      type: Boolean
    },
    updateDigitalCertificates: {
      type: Function,
      required: true
    },
    listEdgeFirewallService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallService: {
      type: Function,
      required: true
    }
  })

  const digitalCertificateDrawerRef = ref('')
  const openDigitalCertificateDrawer = () => {
    digitalCertificateDrawerRef.value.openCreateDrawer()
  }
  const edgeCertificate = ref(0)
  const { value: name } = useField('name')
  const { value: cnames } = useField('cnames')
  const { value: cnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeApplication } = useField('edgeApplication')
  const { value: edgeFirewall } = useField('edgeFirewall')
  const { setValue: setEdgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
  const { value: mtlsTrustedCertificate } = useField('mtlsTrustedCertificate')
  const drawerRef = ref('')
  const drawerEdgeFirewallRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }
  const openDrawerEdgeFirewall = () => {
    drawerEdgeFirewallRef.value.openCreateDrawer()
  }

  const handleEdgeApplicationCreated = (id) => {
    edgeApplication.value = id
    emit('edgeApplicationCreated')
  }

  const handleEdgeFirewallCreated = (id) => {
    edgeFirewall.value = id
    emit('edgeFirewallCreated')
  }

  const edgeCertificates = computed(() => {
    return props.digitalCertificates.filter((certificate) => certificate.type === EDGE_CERTIFICATE)
  })
  const trustedCACertificates = computed(() => {
    return props.digitalCertificates.filter(
      (certificate) => certificate.type === TRUSTED_CA_CERTIFICATE
    )
  })

  const edgeCertificatesOptions = computed(() => {
    const defaultCertificate = [
      { name: 'Azion (SAN)', value: 0 },
      { name: "Let's Encrypt", value: 'lets_encrypt' }
    ]
    const parsedCertificates = edgeCertificates.value?.map((certificate) => ({
      name: certificate.name,
      value: certificate.id
    }))
    return [...defaultCertificate, ...parsedCertificates]
  })
  const trustedCACertificatesOptions = computed(() => {
    return trustedCACertificates.value.map((certificate) => ({
      name: certificate.name,
      value: certificate.id
    }))
  })

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

  const environmentOptionsRadios = ref([
    {
      title: 'Global Edge Network',
      inputValue: 'production'
    },
    {
      title: 'Staging Network',
      inputValue: 'preview'
    }
  ])

  const isLoadingRequestsData = computed(() => {
    return props.isLoadingRequests
  })

  watch(edgeCertificate, async (newEdgeCertificate) => {
    setEdgeCertificate(newEdgeCertificate)
  })

  const onDigitalCertificateSuccess = (domainId) => {
    edgeCertificate.value = domainId
    props.updateDigitalCertificates()
  }

  const emit = defineEmits(['edgeApplicationCreated'])
</script>

<template>
  <form-horizontal
    description="Create a domain with Azion to launch an edge application and set up security with digital certificates."
  >
    <template #title> General </template>
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My domain"
          data-testid="domains-form__name-field"
          :value="name"
          description="This is an identification name for the domain. Once you save the configuration, the URL will be automatically generated."
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
          label=""
          :options="environmentOptionsRadios"
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    description="Determine the edge application of the domain and its digital certificate. To link an existing domain to an application, add it to the CNAME field and block access to the application via the Azion domain."
  >
    <template #title> Settings </template>
    <template #inputs>
      <DrawerEdgeFirewall
        ref="drawerEdgeFirewallRef"
        @onSuccess="handleEdgeFirewallCreated"
      />
      <Drawer
        ref="drawerRef"
        @onEdgeApplicationCreated="handleEdgeApplicationCreated"
      />
      <DigitalCertificatesDrawer
        ref="digitalCertificateDrawerRef"
        @onSuccess="onDigitalCertificateSuccess"
      />
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          label="Edge Application"
          required
          data-testid="domains-form__edge-application-field"
          name="edgeApplication"
          :service="listEdgeApplicationsService"
          :loadService="loadEdgeApplicationsService"
          optionLabel="name"
          optionValue="value"
          :value="edgeApplication"
          appendTo="self"
          placeholder="Select an edge application"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawer"
                  class="w-full whitespace-nowrap flex"
                  data-testid="domains-form__create-edge-application-button"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Application"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          label="Edge Firewall"
          data-testid="domains-form__edge-firewall-field"
          name="edgeFirewall"
          :service="listEdgeFirewallService"
          :loadService="loadEdgeFirewallService"
          optionLabel="name"
          optionValue="value"
          :value="edgeFirewall"
          appendTo="self"
          placeholder="Select an edge firewall"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawerEdgeFirewall"
                  class="w-full whitespace-nowrap flex"
                  data-testid="domains-form__create-edge-firewall-button"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Firewall"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
      <FieldSwitchBlock
        data-testid="domains-form__cname-access-only-field"
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
          :required="cnameAccessOnly"
          name="cnames"
          data-testid="domains-form__cnames-field"
          rows="2"
          :value="cnames"
          description="List of CNAMEs to associate to the Azion domain. Separate each entry in a new line."
        />
      </div>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          data-testid="domains-form__edge-certificate-field"
          label="Digital Certificate"
          name="edgeCertificate"
          :options="edgeCertificatesOptions"
          :loading="isLoadingRequestsData"
          :disabled="isLoadingRequestsData"
          optionLabel="name"
          optionValue="value"
          :value="edgeCertificate"
          filter
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
        data-testid="domains-form__mtls-is-enabled-field"
        nameField="mtlsIsEnabled"
        name="mtlsIsEnabled"
        auto
        :isCard="false"
        title="Mutual Authentication"
      />

      <div v-if="mtlsIsEnabled">
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
        <FieldDropdown
          label="Trusted CA Certificate"
          data-testid="domains-form__mtls-trusted-certificate-field"
          required
          name="mtlsTrustedCertificate"
          :options="trustedCACertificatesOptions"
          :loading="isLoadingRequestsData"
          :disabled="!mtlsIsEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtlsTrustedCertificate"
          filter
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate. Go to Digital Certificates to upload one."
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="domains-form__active-field"
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
