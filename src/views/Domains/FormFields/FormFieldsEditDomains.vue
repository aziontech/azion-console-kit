<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import InputText from 'primevue/inputtext'
  import PrimeTag from 'primevue/tag'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import Drawer from '@/views/EdgeApplications/V3/Drawer'
  import { useField } from 'vee-validate'
  import { computed, ref } from 'vue'
  import DigitalCertificatesDrawer from '@/views/DigitalCertificates/Drawer'
  import DrawerEdgeFirewall from '@/views/EdgeFirewall/Drawer'
  import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
  import CopyBlock from '@/templates/copy-block/copy-block.vue'
  const isLetEncrypt = ref(false)

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
    hasDomainName: {
      type: Boolean,
      required: false,
      default: false
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

  const EDGE_CERTIFICATE = 'edge_certificate'
  const TRUSTED_CA_CERTIFICATE = 'trusted_ca_certificate'

  const { value: name } = useField('name')
  const { value: cnames } = useField('cnames')
  const { value: cnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeApplication } = useField('edgeApplication')
  const { value: edgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
  const { value: environment } = useField('environment')
  const { value: domainName } = useField('domainName')
  const { value: authorityCertificate } = useField('authorityCertificate')

  const { value: mtlsTrustedCertificate } = useField('mtlsTrustedCertificate')

  const { value: edgeFirewall } = useField('edgeFirewall')
  const drawerEdgeFirewallRef = ref('')

  const openDrawerEdgeFirewall = () => {
    drawerEdgeFirewallRef.value.openCreateDrawer()
  }

  const handleEdgeFirewallCreated = (id) => {
    edgeFirewall.value = id
    emit('edgeFirewallCreated')
  }

  const listEdgeApplicationsDecorator = async (queryParams) => {
    return await props.listEdgeApplicationsService({
      ...queryParams,
      isDropdown: true
    })
  }

  const handleEdgeFirewallAccessDenied = () => {
    hasEdgeFirewallAccess.value = false
  }

  const hasEdgeFirewallAccess = ref(true)

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
              request in Firewall, if necessary.`,
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
        inputValue: 'production',
        disabled: true
      },
      {
        title: 'Staging Network',
        inputValue: 'preview',
        disabled: true
      }
    ]

    if (environment.value === 'production') {
      environmentOptionsRadios[0].tag = tag
    } else if (environment.value === 'preview') {
      environmentOptionsRadios[1].tag = tag
    }

    return environmentOptionsRadios
  })

  const drawerRef = ref('')

  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleEdgeFirewallClear = () => {
    edgeFirewall.value = null
  }

  const handleEdgeApplicationCreated = (id) => {
    edgeApplication.value = id
  }

  const emit = defineEmits(['copyDomainName', 'edgeFirewallCreated'])

  const digitalCertificateDrawerRef = ref('')

  const isRequiredCname = computed(() => {
    return cnameAccessOnly.value || isLetEncrypt.value
  })

  const openDigitalCertificateDrawer = (certificate) => {
    digitalCertificateDrawerRef.value.changeCertificateType(certificate)
    digitalCertificateDrawerRef.value.openCreateDrawer()
  }

  const onDigitalCertificateSuccess = ({ type, id, authority }) => {
    authorityCertificate.value = authority
    if (type === TRUSTED_CA_CERTIFICATE) {
      mtlsTrustedCertificate.value = id
      return
    }
    edgeCertificate.value = id
  }

  const listDigitalCertificatesByType = async (type, queryParams) => {
    return await digitalCertificatesService.listDigitalCertificatesDropdown({
      type,
      fields: ['id,name,authority'],
      ...queryParams
    })
  }

  const listDigitalCertificatesByEdgeCertificateTypeDecorator = async (queryParams) => {
    return listDigitalCertificatesByType(EDGE_CERTIFICATE, queryParams)
  }

  const listDigitalCertificatesByTrustedCaCertificateTypeDecorator = async (queryParams) => {
    return listDigitalCertificatesByType(TRUSTED_CA_CERTIFICATE, queryParams)
  }
  const moreOptions = ['authority', 'status']
  const selectCertificate = ({ authority, value }) => {
    authorityCertificate.value = authority
    isLetEncrypt.value =
      value === 'lets_encrypt' || value === 'lets_encrypt_http' || authority === 'lets_encrypt'
  }
</script>

<template>
  <form-horizontal
    title="General"
    description="Check the details of the Azion domain, including the domain address to access the Application, and modify digital certificate options."
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
          <copyBlock :value="domainName" />
        </div>
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Settings"
    description="Determine the Application of the domain and its digital certificate. To link an existing domain to an Application, add it to the CNAME field and block access to the Application via the Azion domain."
  >
    <template #inputs>
      <Drawer
        ref="drawerRef"
        @onEdgeApplicationCreated="handleEdgeApplicationCreated"
      />
      <DigitalCertificatesDrawer
        ref="digitalCertificateDrawerRef"
        @onSuccess="onDigitalCertificateSuccess"
      />
      <DrawerEdgeFirewall
        ref="drawerEdgeFirewallRef"
        @onSuccess="handleEdgeFirewallCreated"
      />

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          label="Application"
          required
          data-testid="domains-form__edge-application-field"
          name="edgeApplication"
          :service="listEdgeApplicationsDecorator"
          :loadService="loadEdgeApplicationsService"
          optionLabel="name"
          optionValue="value"
          :value="edgeApplication"
          appendTo="self"
          placeholder="Select an Application"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawer"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-edge-application-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Application"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <DrawerEdgeFirewall
          ref="drawerEdgeFirewallRef"
          @onSuccess="handleEdgeFirewallCreated"
        />
        <FieldDropdownLazyLoader
          label="Firewall"
          enableClearOption
          @onAccessDenied="handleEdgeFirewallAccessDenied"
          @onClear="handleEdgeFirewallClear"
          v-if="hasEdgeFirewallAccess"
          data-testid="domains-form__edge-firewall-field"
          name="edgeFirewall"
          :service="listEdgeFirewallService"
          :loadService="loadEdgeFirewallService"
          optionLabel="name"
          optionValue="value"
          :value="edgeFirewall"
          appendTo="self"
          placeholder="Select a Firewall"
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
                  label="Create Firewall"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
      <FieldSwitchBlock
        nameField="cnameAccessOnly"
        name="cnameAccessOnly"
        auto
        :isCard="false"
        title="CNAME Access Only"
        subtitle="Check this option to make the Application accessible only through the domains listed in the CNAME field. Attempts to access the Application through the Azion domain will be blocked."
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="CNAME"
          data-testid="domains-form__cnames-field"
          :required="isRequiredCname"
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
          :loadService="digitalCertificatesService.loadDigitalCertificate"
          optionLabel="name"
          optionValue="value"
          :value="edgeCertificate"
          :defaultPosition="1"
          appendTo="self"
          placeholder="Select a certificate"
          :moreOptions="moreOptions"
          @onSelectOption="selectCertificate"
          showGroup
          optionGroupLabel="group"
          optionGroupChildren="items"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDigitalCertificateDrawer(EDGE_CERTIFICATE)"
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
        <FieldDropdownLazyLoader
          label="Trusted CA Certificate"
          required
          name="mtlsTrustedCertificate"
          :service="listDigitalCertificatesByTrustedCaCertificateTypeDecorator"
          :loadService="digitalCertificatesService.loadDigitalCertificate"
          :disabled="!mtlsIsEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtlsTrustedCertificate"
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate. Go to Certificate Manager to upload one."
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDigitalCertificateDrawer(TRUSTED_CA_CERTIFICATE)"
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
