<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@templates/edit-form-block'
  import FormFieldsEdgeDnsEdit from './FormFields/FormFieldsEditEdgeDns.vue'
  import { inject } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    clipboardWrite: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    edgeDNS: { type: Object }
  })

  const toast = useToast()

  const validationSchema = yup.object({
    name: yup.string().required(),
    domain: yup
      .string()
      .required()
      .test('valid-domain', 'Invalid domain', function (value) {
        const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
        return domainRegex.test(value)
      }),
    isActive: yup.boolean().required(),
    dnssec: yup.boolean()
  })

  const loadEdgeDNSService = async () => {
    const zoneData = props.edgeDNS
    try {
      const dnssecData = await edgeDNSService.loadEdgeDNSZoneDNSSEC(zoneData.id)
      return { ...zoneData, dnssec: dnssecData?.enabled ?? false }
    } catch {
      return { ...zoneData, dnssec: false }
    }
  }

  const handleCopy = (nameserver) => {
    props.clipboardWrite(nameserver)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Edge DNS Zone'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge DNS Zone',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <div>
    <EditFormBlock
      :editService="edgeDNSService.editEdgeDNSService"
      :loadService="loadEdgeDNSService"
      :schema="validationSchema"
      :updatedRedirect="updatedRedirect"
      disableRedirect
      :isTabs="true"
      @on-edit-success="handleTrackEditEvent"
      @on-edit-fail="handleTrackFailEditEvent"
    >
      <template #form>
        <FormFieldsEdgeDnsEdit :handleCopy="handleCopy" />
      </template>
      <template #action-bar="{ onSubmit, onCancel, loading }">
        <ActionBarTemplate
          @onSubmit="onSubmit"
          @onCancel="onCancel"
          :loading="loading"
        />
      </template>
    </EditFormBlock>
  </div>
</template>
