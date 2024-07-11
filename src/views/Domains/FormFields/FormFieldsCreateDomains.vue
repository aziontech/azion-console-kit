<script setup>
  import {
    EDGE_CERTIFICATE,
    TRUSTED_CA_CERTIFICATE
  } from '@/services/digital-certificates-services'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import PrimeButton from 'primevue/button'

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
  const { value: name } = useField('name')
  const { value: cnames } = useField('cnames')
  const { value: cnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeApplication } = useField('edgeApplication')
  const { setValue: setEdgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')
  const { value: mtlsTrustedCertificate } = useField('mtlsTrustedCertificate')

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
    description=" Create a domain with Azion to launch an edge application and set up security with digital
      certificates."
  >
    <template #title>
      General
      <PrimeButton
        outlined
        icon="ai ai-ask-azion"
        v-tooltip.bottom="'Need help?'"
        v-prompt="
          'Help me to create an Domain, give me instructions for each field of create Domain form.'
        "
      ></PrimeButton>
    </template>
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
    description="Determine the edge application of the domain and its digital certificate. To link an existing domain to an application, add it to the CNAME field and block access to the application via the Azion domain."
  >
    <template #title>
      Settings
      <PrimeButton
        outlined
        icon="ai ai-ask-azion"
        v-tooltip.bottom="'Need help?'"
        v-prompt="
          'Explain me the use of the CNAME field and the CNAME Access Only option. Also tell me about the diference between Digital Certificate Options'
        "
      ></PrimeButton>
    </template>
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdown
          label="Edge Application"
          required
          data-testid="domains-form__edge-application-field"
          name="edgeApplication"
          :options="edgeApplicationOptions"
          :loading="!edgeApplicationOptions.length"
          :disabled="!edgeApplicationOptions.length"
          optionLabel="name"
          optionValue="value"
          :value="edgeApplication"
          filter
          appendTo="self"
          placeholder="Select an edge application"
        />
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
        <FieldDropdown
          data-testid="domains-form__edge-certificate-field"
          label="Digital Certificate"
          name="edgeCertificate"
          :options="edgeCertificatesOptions"
          :loading="!edgeCertificatesOptions.length"
          :disabled="!edgeCertificatesOptions.length"
          optionLabel="name"
          optionValue="value"
          :value="edgeCertificate"
          filter
          appendTo="self"
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
          :loading="!trustedCACertificatesOptions.length"
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
