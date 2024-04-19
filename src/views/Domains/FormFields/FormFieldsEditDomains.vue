<script setup>
  import {
    EDGE_CERTIFICATE,
    TRUSTED_CA_CERTIFICATE
  } from '@/services/digital-certificates-services'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import Card from 'primevue/card'
  import Dropdown from 'primevue/dropdown'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import RadioButton from 'primevue/radiobutton'
  import PrimeTextarea from 'primevue/textarea'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const props = defineProps({
    digitalCertificates: {
      type: Array,
      required: true
    },
    edgeApps: {
      type: Array,
      required: true
    },
    hasDomainName: {
      type: Boolean,
      required: false,
      default: false
    }
  })

  const edgeCertificate = ref(0)
  const { value: name, errorMessage: errorName } = useField('name')
  const { value: cnames, errorMessage: errorCnames } = useField('cnames')
  const { value: cnameAccessOnly, errorMessage: errorCnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeApplication, errorMessage: errorEdgeApplication } = useField('edgeApplication')
  const { setValue: setEdgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled, errorMessage: errorMtlsIsEnabled } = useField('mtlsIsEnabled')
  const { value: active } = useField('active')
  const { value: domainName } = useField('domainName')
  const { value: mtlsVerification } = useField('mtlsVerification')
  const { value: mtlsTrustedCertificate, errorMessage: errorMtlsTrustedCertificate } =
    useField('mtlsTrustedCertificate')

  const CNAMELabel = computed(() => {
    return cnameAccessOnly.value ? 'CNAME *' : 'CNAME'
  })

  const edgeCertificates = computed(() => {
    return props.digitalCertificates.filter((certificate) => certificate.type === EDGE_CERTIFICATE)
  })
  const trustedCACertificates = computed(() => {
    return props.digitalCertificates.filter(
      (certificate) => certificate.type === TRUSTED_CA_CERTIFICATE
    )
  })
  const edgeApplicationOptions = computed(() => {
    return props.edgeApps.map((edgeApp) => ({ name: edgeApp.name, value: edgeApp.id }))
  })
  const edgeCertificatesOptions = computed(() => {
    const defaultCertificate = [
      { name: 'Azion (SAN)', value: 0 },
      { name: "Let's Encrypt (BETA)", value: 'lets_encrypt' }
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

  watch(edgeCertificate, async (newEdgeCertificate) => {
    setEdgeCertificate(newEdgeCertificate)
  })
</script>

<template>
  <form-horizontal
    title="General"
    description="Check the details of the Azion domain, including the domain address to access the application, and modify digital certificate options."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          v-model="name"
          id="name"
          type="text"
          :class="{ 'p-invalid': errorName }"
          placeholder="My domain"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name to identify the domain.
        </small>
        <small
          v-if="errorName"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorName }}</small
        >
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Domain"
    description="The domain name attributed by Azion."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <label
          for="domainName"
          class="text-color text-base font-medium"
        >
          Domain Name
        </label>
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock" />
            <InputText
              id="domainName"
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
            type="button"
            aria-label="Copy Domain Name"
            label="Copy"
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
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="edge_application"
          class="text-color text-base font-medium"
          >Edge Application *</label
        >
        <Dropdown
          appendTo="self"
          id="edge_application"
          :class="{ 'p-invalid': errorEdgeApplication }"
          v-model="edgeApplication"
          :options="edgeApplicationOptions"
          optionLabel="name"
          optionValue="value"
          class="w-full"
          placeholder="Select an edge application"
        />
        <small
          v-if="errorEdgeApplication"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorEdgeApplication }}</small
        >
      </div>

      <div class="flex gap-2 items-top">
        <InputSwitch
          id="cnameAccessOnly"
          class="flex-shrink-0 flex-grow"
          :class="{ 'p-invalid': errorCnameAccessOnly }"
          v-model="cnameAccessOnly"
        />
        <div class="flex flex-col gap-1">
          <label class="text-sm font-normal leading-tight">CNAME Access Only </label>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Check this option to make the application accessible only through the domains listed in
            the CNAME field. Attempts to access the application through the Azion domain will be
            blocked.
          </small>
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="cname"
          class="text-color text-base font-medium"
          >{{ CNAMELabel }}</label
        >
        <PrimeTextarea
          id="cname"
          :class="{ 'p-invalid': errorCnames }"
          v-model="cnames"
          rows="2"
          cols="30"
          class="w-full"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          List of CNAMEs to associate to the Azion domain. Separate each entry in a new line.
        </small>
        <small
          v-if="errorCnames"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorCnames }}</small
        >
      </div>

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="edge_application"
          class="text-color text-base font-medium"
          >Digital Certificate</label
        >
        <Dropdown
          appendTo="self"
          v-model="edgeCertificate"
          :options="edgeCertificatesOptions"
          optionLabel="name"
          optionValue="value"
          class="w-full"
          placeholder="Select a certificate"
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="mtls"
          :class="{ 'p-invalid': errorMtlsIsEnabled }"
          v-model="mtlsIsEnabled"
        />
        <label
          for="mtls"
          class="text-base"
          >Mutual Authentication</label
        >
      </div>

      <div
        v-if="mtlsIsEnabled"
        class="flex flex-col gap-2"
      >
        <label class="text-color text-base font-medium">Mode</label>
        <div class="flex flex-col gap-3">
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between font-medium text-base m-0' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Enforce</span>
              <RadioButton
                :disabled="!mtlsIsEnabled"
                v-model="mtlsVerification"
                inputId="enforce"
                name="mtls-verification"
                value="enforce"
              />
            </template>
            <template #subtitle>
              Blocks the client certificate during the TLS handshake if the uploaded Trusted CA
              can't be validated.
            </template>
          </Card>

          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between font-medium text-base m-0' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Permissive</span>
              <RadioButton
                :disabled="!mtlsIsEnabled"
                v-model="mtlsVerification"
                inputId="permissive"
                name="mtls-verification"
                value="permissive"
              />
            </template>
            <template #subtitle>
              Attempts to verify the client certificate, but will allow the TLS handshake even if
              the Trusted CA can't be validated. Check which client certificate attempted the
              request in Edge Firewall, if necessary.
            </template>
          </Card>
        </div>
      </div>
      <div
        v-if="mtlsIsEnabled"
        class="flex flex-col w-full sm:max-w-xs gap-2"
      >
        <label class="text-color text-base font-medium">Trusted CA Certificate</label>
        <Dropdown
          appendTo="self"
          :class="{ 'p-invalid': errorMtlsTrustedCertificate }"
          v-model="mtlsTrustedCertificate"
          :options="trustedCACertificatesOptions"
          optionLabel="name"
          optionValue="value"
          class="w-full"
          placeholder="Select a Trusted CA certificate"
          :disabled="!mtlsIsEnabled"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Mutual Authentification requires a Trusted CA Certificate. Go to Digital Certificates to
          upload one.
        </small>
        <small
          v-if="errorMtlsTrustedCertificate"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorMtlsTrustedCertificate }}</small
        >
      </div>
    </template>
  </form-horizontal>

  <form-horizontal title="Status">
    <template #inputs>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="active"
          v-model="active"
        />
        <label
          for="active"
          class="text-base"
          >Active</label
        >
      </div>
    </template>
  </form-horizontal>
</template>
