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
          :service="edgeConnectorsService.listEdgeConnectorsService"
          :loadService="edgeConnectorsService.loadEdgeConnectorsService"
          optionLabel="name"
          optionValue="value"
          placeholder="Select a Edge Connector"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openCreateEdgeConnectorDrawer"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-edge-connector-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Connector"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isConnector"
      >
        <FieldText
          label="Page Path (URI)"
          placeholder="/path/error_page.html"
          name="uri"
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
          rows="4"
          disabled
        />
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
  import { edgeConnectorsService } from '@/services/v2'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'

  const { value: typeValue } = useField('type')
  const { value: ttl } = useField('ttl')
  const { value: connector } = useField('connector')
  const { value: uri } = useField('uri')

  const isConnector = computed(() => {
    return typeValue.value === 'Connector'
  })

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })
</script>
