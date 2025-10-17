<template>
  <FormHorizontal
    title="Response Details"
    description="Customize the response for this status code. Specify the URI, status code, TTL, content type, and the response body to be returned to the client."
    :isDrawer="props.isDrawer"
  >
    <template #inputs>
      <ConnectorDrawer
        ref="drawerConnectorRef"
        @onSuccess="successCreateConnector"
      />
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isConnector"
      >
        <FieldDropdownLazyLoader
          label="Connector"
          required
          name="connector"
          :value="connector"
          :service="listEdgeConnectors"
          :loadService="edgeConnectorsService.loadEdgeConnectorsService"
          optionLabel="name"
          optionValue="value"
          placeholder="Select a Connector"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  @click="openDrawerConnector"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="response-details__create-connector-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Connector"
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
  import ConnectorDrawer from '@/views/EdgeConnectors/Drawer/index.vue'
  import PrimeButton from 'primevue/button'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const { value: response } = useField('response')

  const { value: typeValue } = useField('type')
  const { value: ttl } = useField('ttl')
  const { value: customStatusCode } = useField('customStatusCode')
  const { value: connector } = useField('connector')
  const { value: uri } = useField('uri')

  const drawerConnectorRef = ref('')
  const emit = defineEmits(['isOverlapped'])

  const isConnector = computed(() => {
    return typeValue.value === 'page_connector'
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

  const openDrawerConnector = () => {
    drawerConnectorRef.value.openCreateDrawer()
  }

  const successCreateConnector = ({ id }) => {
    connector.value = id
  }

  const listEdgeConnectors = async (params) => {
    params.fields = 'id,name,type'
    params.active = true
    return await edgeConnectorsService.listEdgeConnectorsDropDownService(
      params,
      (item) => item.type !== 'Live Ingest'
    )
  }

  watch(
    () => drawerConnectorRef.value.showCreateEdgeConnectorsDrawer,
    (newValue) => {
      emit('isOverlapped', newValue)
    }
  )
</script>
