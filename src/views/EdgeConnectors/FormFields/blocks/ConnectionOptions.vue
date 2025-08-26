<template>
  <FormHorizontal
    title="Connection Options"
    :description="getDescriptionByType"
    data-testid="edge-connectors-form__section__connection-options"
  >
    <template #inputs>
      <DrawerEdgeStorage
        ref="drawerEdgeStorageRef"
        @onSuccess="handleEdgeStorageCreated"
      />
      <div
        v-if="type === 'http'"
        class="flex flex-col gap-8"
      >
        <div class="flex flex-col sm:max-w-sm w-full gap-2">
          <FieldText
            label="Host"
            description="Enter the domain or IP address of the origin server (e.g., 'example.com' or '192.168.0.1')."
            name="connectionOptions.host"
            :value="host"
            placeholder="example.com"
            data-testid="edge-connectors-form__connection-options__host-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-sm w-full gap-2">
          <FieldText
            label="Path"
            description="Specify the path to the resource on the origin server (e.g., '/api/v1/resource'). Use '/' for the root path."
            name="connectionOptions.path"
            :value="path"
            placeholder="/api/v1/resource"
            data-testid="edge-connectors-form__connection-options__path-field"
          />
        </div>

        <div class="flex sm:flex-row flex-col w-full gap-8">
          <div class="flex flex-col sm:max-w-xs w-full gap-2">
            <FieldText
              label="Real IP Header"
              description="Provide the header name that contains the client's real IP address (e.g., 'X-Real-IP')."
              name="connectionOptions.realIpHeader"
              :value="realIpHeader"
              placeholder="X-Real-IP"
              data-testid="edge-connectors-form__connection-options__real-ip-header-field"
            />
          </div>
          <div class="flex flex-col sm:max-w-xs w-full gap-2">
            <FieldText
              label="Real Port Header"
              description="Provide the header name that contains the client's real port (e.g., 'X-Real-PORT)."
              name="connectionOptions.realPortHeader"
              :value="realPortHeader"
              placeholder="X-Real-PORT"
              data-testid="edge-connectors-form__connection-options__real-port-header-field"
            />
          </div>
        </div>

        <div class="flex flex-col sm:max-w-sm w-full gap-2">
          <FieldSwitchBlock
            nameField="connectionOptions.followingRedirect"
            name="connectionOptions.followingRedirect"
            :value="followingRedirect"
            title="Following Redirect"
            :isCard="false"
            description="Enable this option to automatically follow HTTP redirects from the origin server."
            data-testid="edge-connectors-form__connection-options__following-redirect-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldDropdown
            label="DNS Resolution Policy"
            name="connectionOptions.dnsResolution"
            :options="dnsResolutionList"
            optionLabel="label"
            optionValue="value"
            :value="dnsResolution"
            appendTo="self"
            description="Define how DNS resolution is handled for this connection."
            data-testid="edge-connectors-form__connection-options__dns-resolution-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldDropdown
            label="Transport Protocol Policy"
            name="connectionOptions.transportPolicy"
            :options="transportPolicyList"
            optionLabel="label"
            optionValue="value"
            :value="transportPolicy"
            appendTo="self"
            description="Specify the transport protocol behavior for the connection."
            data-testid="edge-connectors-form__connection-options__transport-policy-field"
          />
        </div>
      </div>
      <div
        v-if="type === 'edge_storage'"
        class="flex flex-col gap-8"
      >
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldDropdownLazyLoader
            ref="bucketDropdownRef"
            data-testid="edge-connectors-form__connection-options__bucket-name-field"
            label="Bucket"
            description="Enter the name of the bucket to connect to."
            placeholder="Select a Bucket"
            required
            name="connectionOptions.bucket"
            :service="edgeStorageService.listEdgeStorageBuckets"
            :loadService="edgeStorageService.listEdgeStorageBuckets"
            disableEmitFirstRender
            optionLabel="name"
            optionValue="name"
            :value="bucket"
            inputId="bucket"
          >
            <template #footer>
              <ul class="p-2">
                <li>
                  <PrimeButton
                    @click="openDrawerEdgeStorage"
                    class="w-full whitespace-nowrap flex"
                    data-testid="domains-form__create-edge-storage-button"
                    text
                    size="small"
                    icon="pi pi-plus-circle"
                    :pt="{
                      label: { class: 'w-full text-left' },
                      root: { class: 'p-2' }
                    }"
                    label="Create Edge Storage"
                  />
                </li>
              </ul>
            </template>
          </FieldDropdownLazyLoader>
        </div>

        <div class="flex flex-col sm:max-w-sm w-full gap-2">
          <FieldText
            label="Prefix"
            description="Specify the prefix to filter the objects within the selected bucket (e.g., images/ or logs/)."
            name="connectionOptions.prefix"
            :value="prefix"
            placeholder="images/"
            data-testid="edge-connectors-form__connection-options__prefix-field"
          />
        </div>
      </div>
      <div
        v-if="type === 'live_ingest'"
        class="flex flex-col gap-8"
      >
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldDropdown
            label="Region"
            name="connectionOptions.region"
            :options="regionList"
            optionLabel="label"
            optionValue="value"
            :value="region"
            appendTo="self"
            description="Select the region where the live stream will be ingested to optimize latency and performance."
            data-testid="edge-connectors-form__connection-options__region-field"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useField } from 'vee-validate'
  import { edgeStorageService } from '@/services/v2'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import PrimeButton from 'primevue/button'
  import DrawerEdgeStorage from '@/views/EdgeStorage/Drawer/index.vue'

  defineOptions({ name: 'EdgeConnectorsFormFieldsConnectionOptions' })

  const { value: host } = useField('connectionOptions.host')
  const { value: path } = useField('connectionOptions.path')
  const { value: realIpHeader } = useField('connectionOptions.realIpHeader')
  const { value: realPortHeader } = useField('connectionOptions.realPortHeader')
  const { value: followingRedirect } = useField('connectionOptions.followingRedirect')
  const { value: dnsResolution } = useField('connectionOptions.dnsResolution')
  const { value: transportPolicy } = useField('connectionOptions.transportPolicy')

  const { value: region } = useField('connectionOptions.region')
  const { value: bucket } = useField('connectionOptions.bucket')
  const { value: prefix } = useField('connectionOptions.prefix')

  const { value: type } = useField('type')

  const dnsResolutionList = [
    { label: 'Preserve', value: 'preserve' },
    { label: 'Force IPv6', value: 'force_ipv6' },
    { label: 'Force IPv4', value: 'force_ipv4' }
  ]
  const transportPolicyList = [
    { label: 'Preserve', value: 'preserve' },
    { label: 'Force HTTPS', value: 'force_https' },
    { label: 'Force HTTP', value: 'force_http' }
  ]
  const regionList = [
    { label: 'us-east-1', value: 'us-east-1' },
    { label: 'us-east-2', value: 'us-east-2' },
    { label: 'br-east-1', value: 'br-east-1' },
    { label: 'br-east-2', value: 'br-east-2' },
    { label: 'br-east-3', value: 'br-east-3' }
  ]

  const drawerEdgeStorageRef = ref(null)
  const bucketDropdownRef = ref(null)

  const openDrawerEdgeStorage = () => {
    drawerEdgeStorageRef.value.openCreateDrawer()
  }

  const handleEdgeStorageCreated = async (newBucket) => {
    await bucketDropdownRef.value?.refreshData()
    bucket.value = newBucket
  }

  const getDescriptionByType = computed(() => {
    switch (type.value) {
      case 'http':
        return 'Customize settings related to origin servers and hosts.'
      case 'edge_storage':
        return 'Configure the connection to your Edge Storage bucket to enable seamless data access and retrieval at the edge.'
      case 'live_ingest':
        return 'Set up the connection for live media stream ingestion to ensure real-time processing and delivery through the edge network.'
      default:
        return ''
    }
  })
</script>
