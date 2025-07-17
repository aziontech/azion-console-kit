<template>
  <FormHorizontal
    title="Response Details"
    description="Customize the response for this status code. Specify the URI, status code, TTL, content type, and the response body to be returned to the client."
    :isDrawer="props.isDrawer"
  >
    <template #inputs>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isConnector"
      >
        <FieldDropdownLazyLoader
          label="Edge Connector"
          required
          name="connector"
          :value="connector"
          :service="listEdgeConnectors"
          :loadService="edgeConnectorsService.loadEdgeConnectorsService"
          optionLabel="name"
          optionValue="value"
          placeholder="Select a Edge Connector"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isConnector"
      >
        <FieldText
          label="Page Path (URI)"
          placeholder="/path/error_page.html"
          name="uri"
          required
          :value="uri"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isConnector"
      >
        <FieldNumber
          label="Response Custom Status Code"
          required
          name="customStatusCode"
          :value="customStatusCode"
          :min="100"
          :max="599"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isConnector"
      >
        <FieldNumber
          label="Response TTL"
          required
          name="ttl"
          :value="ttl"
          :min="0"
          :max="31536000"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="!isConnector"
      >
        <FieldTextIcon
          icon="pi pi-lock"
          label="Content Type"
          placeholder="text/html"
          name="contentType"
          disabled
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="!isConnector"
      >
        <FieldTextarea
          label="Response"
          icon="pi pi-lock"
          placeholder="Response body"
          name="response"
          :value="response"
          rows="4"
          disabled
        />
        <div class="flex">
          <PrimeButton
            icon="pi pi-clone"
            outlined
            type="button"
            aria-label="Copy Response"
            label="Copy Response"
            @click="copyResponse"
            :data-testid="`copy-response-button`"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextarea from '@/templates/form-fields-inputs/fieldTextArea'
  import PrimeButton from 'primevue/button'
  import { clipboardWrite } from '@/helpers'
  import { edgeConnectorsService } from '@/services/v2'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()

  const { value: response } = useField('response')

  const { value: typeValue } = useField('type')
  const { value: ttl } = useField('ttl')
  const { value: customStatusCode } = useField('customStatusCode')
  const { value: connector } = useField('connector')
  const { value: uri } = useField('uri')

  const isConnector = computed(() => {
    return typeValue.value === 'PageConnector'
  })

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  })

  const listEdgeConnectors = async (params) => {
    params.fields = 'id,name,type'
    params.active = true
    return await edgeConnectorsService.listEdgeConnectorsDropDownService(
      params,
      (item) => item.type !== 'Live Ingest'
    )
  }

  const copyResponse = () => {
    try {
      clipboardWrite(response.value)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Response copied to clipboard',
        life: 3000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy response to clipboard',
        life: 3000
      })
    }
  }
</script>
