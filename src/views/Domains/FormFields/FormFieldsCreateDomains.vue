<script setup>
  import {
    EDGE_CERTIFICATE,
    TRUSTED_CA_CERTIFICATE
  } from '@/services/digital-certificates-services'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

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
  useField('active')
  useField('mtlsVerification')
  const { value: name, errorMessage: errorName } = useField('name')
  const { value: cnames, errorMessage: errorCnames } = useField('cnames')
  const { value: cnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeApplication, errorMessage: errorEdgeApplication } = useField('edgeApplication')
  const { setValue: setEdgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
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

  watch(edgeCertificate, async (newEdgeCertificate) => {
    setEdgeCertificate(newEdgeCertificate)
  })
</script>

<template>
  <form-horizontal
    title="General"
    description="Create a domain with Azion to launch an edge application and set up security with digital certificates."
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
          This is an identification name for the domain. Once you save the configuration, the URL
          will be automatically generated.
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

      <FieldSwitchBlock
        nameField="cnameAccessOnly"
        name="cnameAccessOnly"
        auto
        :isCard="false"
        title="CNAME Access Only"
        subtitle="Check this option to make the application accessible only through the domains listed in the CNAME field. Attempts to access the application through the Azion domain will be blocked."
      />

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
      <FieldSwitchBlock
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
