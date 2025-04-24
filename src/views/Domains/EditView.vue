<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="domainName"
        :tag="tagLocked"
      ></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editDomainService"
        :loadService="loadDomainService"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        @loaded-service-object="setDomainName"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <InlineMessage
            severity="warn"
            v-if="isLocked"
          >
            <b>Warning</b>
            {{ INFORMATION_TEXTS.LOCKED_MESSAGE }}
          </InlineMessage>
          <FormFieldsEditDomains
            :digitalCertificates="digitalCertificates"
            :listEdgeApplicationsService="listEdgeApplicationsService"
            :loadEdgeApplicationsService="loadEdgeApplicationsService"
            :listEdgeFirewallService="listEdgeFirewallService"
            :loadEdgeFirewallService="loadEdgeFirewallService"
            :listDigitalCertificatesService="listDigitalCertificatesService"
            :loadDigitalCertificatesService="loadDigitalCertificatesService"
            hasDomainName
            @copyDomainName="copyDomainName"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, inject, onMounted, computed } from 'vue'

  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditDomains from './FormFields/FormFieldsEditDomains.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import InlineMessage from 'primevue/inlinemessage'
  import { INFORMATION_TEXTS } from '@/helpers'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useRoute } from 'vue-router'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    editDomainService: {
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
    loadDomainService: {
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
    },
    checkWorkloadLockedService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    updateDigitalCertificates: {
      type: Function,
      required: true
    }
  })

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Domain'
    })
  }

  const tagProps = {
    value: 'Locked',
    severity: 'warning',
    tooltip: INFORMATION_TEXTS.LOCKED_MESSAGE_TOOLTIP
  }

  const tagLocked = computed(() => {
    if (isLocked.value) {
      return tagProps
    }
    return null
  })

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Domain',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const digitalCertificates = ref([])
  const toast = useToast()
  const domainName = ref()
  const isLocked = ref(false)
  const route = useRoute()

  const showToast = (severity, summary) => {
    toast.add({
      closable: true,
      severity,
      summary
    })
  }

  const copyDomainName = ({ name }) => {
    props.clipboardWrite(name)
    showToast('success', 'Successfully copied!')
  }

  const setDomainName = async (domain) => {
    domainName.value = domain.name
  }

  const checkLockedWorkload = async () => {
    const workloadId = route.params.id
    isLocked.value = await props.checkWorkloadLockedService({
      id: workloadId
    })
  }

  const validationSchema = yup.object({
    id: yup.string().required(),
    name: yup
      .string()
      .required()
      .test(
        'only-ascii',
        'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
        function (value) {
          const nameRegex = /^[\x20-\x21\x23-\x7E]+$/
          return nameRegex.test(value)
        }
      ),
    domainName: yup.string().required(),
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

  onMounted(() => {
    checkLockedWorkload()
  })
</script>
