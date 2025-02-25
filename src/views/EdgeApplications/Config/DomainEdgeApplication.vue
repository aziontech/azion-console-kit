<template>
  <FormAccordion
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createDomainService"
    disabledCallback
    @on-response="handleResponse"
  >
    <template #form>
      <FormFieldsCreateDomains
        isDrawer
        noBorder
        :listEdgeFirewallService="listEdgeFirewallService"
        :loadEdgeFirewallService="loadEdgeFirewallService"
        :listDigitalCertificatesService="listDigitalCertificatesService"
        :loadDigitalCertificatesService="loadDigitalCertificateService"
        :loadEdgeApplicationsService="loadEdgeApplicationsService"
        :listEdgeApplicationsService="listEdgeApplicationsService"
        :disabledEdgeApplicationDropdown="true"
      />
    </template>
    <template #action-bar-accordion="{ onSubmit, loading }">
      <ActionBarAccordion
        @onSubmit="onSubmit"
        :loading="loading"
        data-testid="create-edge-application-action-bar"
      />
    </template>
  </FormAccordion>
</template>
<script setup>
  import ActionBarAccordion from '@/templates/action-bar-block/action-bar-accordion.vue'
  import FormAccordion from '@/templates/create-form-block/form-accordion.vue'
  import FormFieldsCreateDomains from '@/views/Domains/FormFields/FormFieldsCreateDomains.vue'
  import { useRoute } from 'vue-router'
  import { ref } from 'vue'
  import * as yup from 'yup'

  const emit = defineEmits(['createdDomain'])

  defineProps({
    listEdgeFirewallService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallService: {
      type: Function,
      required: true
    },
    listDigitalCertificatesService: {
      type: Function,
      required: true
    },
    loadDigitalCertificatesService: {
      type: Function,
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
    createDomainService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const edgeApplicationId = ref(route.params.id)

  const validationSchema = yup.object({
    name: yup
      .string()
      .label('Name')
      .required()
      .test(
        'only-ascii',
        'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
        function (value) {
          const nameRegex = /^[\x20-\x21\x23-\x7E]+$/
          return nameRegex.test(value)
        }
      ),
    edgeApplication: yup.number().label('Edge Application'),
    cnames: yup
      .string()
      .label('CNAME')
      .when('cnameAccessOnly', {
        is: true,
        then: (schema) => schema.required()
      })
      .test({
        name: 'no-whitespace',
        message: `Space characters aren't allowed.`,
        test: (value) => value?.includes(' ') === false
      }),
    httpsPort: yup.array().when('useHttps', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    minimumTlsVersion: yup.string().when('useHttps', {
      is: true,
      then: (schema) => schema.required().label('TLS Version'),
      otherwise: (schema) => schema.notRequired()
    }),
    httpPort: yup.array().min(1).required(),
    quicPort: yup.array().when('useHtpp3', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    cnameAccessOnly: yup.boolean(),
    edgeCertificate: yup.string().optional(),
    mtlsIsEnabled: yup.boolean(),
    mtlsVerification: yup.string(),
    mtlsTrustedCertificate: yup
      .string()
      .when('mtlsIsEnabled', {
        is: true,
        then: (schema) => schema.required()
      })
      .label('Trusted CA Certificate'),
    active: yup.boolean(),
    environment: yup.string()
  })

  const initialValues = {
    name: '',
    environment: '1',
    edgeApplication: parseInt(edgeApplicationId.value),
    edgeFirewall: null,
    deliveryProtocol: 'https',
    httpPort: [{ name: '80 (Default)', value: 80 }],
    httpsPort: [{ name: '443 (Default)', value: 443 }],
    quicPort: [{ name: '443 (Default)', value: 443 }],
    minimumTlsVersion: 'tls_1_2',
    useHttps: false,
    useHttp3: false,
    cnames: '',
    cnameAccessOnly: true,
    mtlsIsEnabled: false,
    mtlsVerification: 'enforce',
    active: true
  }

  const handleResponse = () => {
    emit('createdDomain')
  }
</script>
