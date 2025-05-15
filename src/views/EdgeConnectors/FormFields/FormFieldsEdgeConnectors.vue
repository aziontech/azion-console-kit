<template>
  <FormHorizontal
    title="General"
    description="Create a edge connectors."
    data-testid="edge-connectors-form__section__general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          description="Give a unique and descriptive name to identify the edge connectors."
          name="name"
          :value="name"
          placeholder="My Edge Connector"
          data-testid="edge-connectors-form__general__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Host Settings"
    description="Customize settings related to origin servers and hosts."
    data-testid="edge-connectors-form__section__host-settings"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Type"
          required
          name="type"
          :options="types"
          optionLabel="label"
          optionValue="value"
          :value="type"
          appendTo="self"
          description="Select an option to customize the edge connectors."
          data-testid="edge-connectors-form__host-settings__type-field"
        />
      </div>

      <div
        class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
        v-if="type === 'http'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Host"
            required
            description=""
            :value="host"
            name="http.host"
            placeholder="Host"
            data-testid="edge-connectors-form__host-settings__http-host-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Path"
            required
            description=""
            :value="path"
            name="http.path"
            placeholder="Path"
            data-testid="edge-connectors-form__host-settings__http-path-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Real Ip Header"
            required
            description=""
            :value="realIpHeader"
            name="http.realIpHeader"
            placeholder="Real Ip Header"
            data-testid="edge-connectors-form__host-settings__http-real-ip-header-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Real Port Header"
            required
            description=""
            :value="realPortHeader"
            name="http.realPortHeader"
            placeholder="Real Port Header"
            data-testid="edge-connectors-form__host-settings__http-real-port-header-field"
          />
        </div>

        <div class="flex flex-col w-full gap-2">
          <FieldSwitchBlock
            nameField="http.followingRedirect"
            name="http.followingRedirect"
            auto
            :isCard="false"
            title="Following Redirect"
            :value="followingRedirect"
            data-testid="edge-connectors-form__host-settings__http-following-redirect-field"
          />
        </div>
      </div>

      <div
        class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
        v-if="type === 's3'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Host"
            required
            description=""
            :value="s3Host"
            name="s3.host"
            placeholder="Host"
            data-testid="edge-connectors-form__host-settings__s3-host-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Bucket"
            required
            description=""
            :value="s3Bucket"
            name="s3.bucket"
            placeholder="Bucket"
            data-testid="edge-connectors-form__host-settings__s3-bucket-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Path"
            required
            description=""
            :value="s3Path"
            name="s3.path"
            placeholder="Path"
            data-testid="edge-connectors-form__host-settings__s3-path-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Region"
            required
            description=""
            :value="s3Region"
            name="s3.region"
            placeholder="Region"
            data-testid="edge-connectors-form__host-settings__s3-region-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Access Key"
            required
            description=""
            :value="s3AccessKey"
            name="s3.accessKey"
            placeholder="Access Key"
            data-testid="edge-connectors-form__host-settings__s3-access-key-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Secret Key"
            required
            description=""
            :value="s3SecretKey"
            name="s3.secretKey"
            placeholder="Secret Key"
            data-testid="edge-connectors-form__host-settings__s3-secret-key-field"
          />
        </div>
      </div>

      <div
        class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
        v-if="type === 'edge_storage'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Bucket"
            required
            description=""
            :value="edgeStorageBucket"
            name="edgeStorage.bucket"
            placeholder="Bucket"
            data-testid="edge-connectors-form__host-settings__edge-storage-bucket-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Prefix"
            required
            description=""
            :value="edgeStoragePrefix"
            name="edgeStorage.prefix"
            placeholder="Prefix"
            data-testid="edge-connectors-form__host-settings__edge-storage-prefix-field"
          />
        </div>
      </div>

      <div
        class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
        v-if="type === 'live_ingest'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldDropdown
            label="Endpoint"
            name="liveIngestEndpoint"
            :options="liveIngestEndpoints"
            optionLabel="label"
            optionValue="value"
            :value="liveIngestEndpoint"
            appendTo="self"
            description=""
            data-testid="edge-connectors-form__host-settings__liveIngestEndpoint-field"
          />
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldGroupRadio
          label="TLS"
          nameField="tlsPolicy"
          :isCard="false"
          :options="tlsRadioOptions"
          :value="tlsPolicy"
          helpText=""
          :disabled="!originShieldEnabled"
          data-testid="edge-connectors-form__host-settings__tls-field"
        />
      </div>

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <LabelBlock
          for="connection-preferences"
          data-testid="form-horizontal-delivery-settings-connection-preferences-label"
          label="Connection Preference"
          isRequired
        />
        <span class="p-input-icon-right">
          <MultiSelect
            :options="connectionPreferences"
            v-model="connectionPreference"
            name="connectionPreference"
            filter
            autoFilterFocus
            optionLabel="label"
            optionValue="value"
            placeholder="Select an HTTP port"
            class="w-full"
            display="chip"
            data-testid="form-horizontal-delivery-settings-http-ports-multi-select"
          />
        </span>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Loader Balance Method"
          name="loadBalanceMethod"
          :options="loadBalancerMethods"
          optionLabel="label"
          optionValue="value"
          :value="loadBalanceMethod"
          appendTo="self"
          description=""
          :disabled="!loadBalancerEnabled"
          data-testid="edge-connectors-form__host-settings__loader-balance-method-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Modules"
    description="Modules a edge connectors."
    data-testid="edge-connectors-form__section__modules"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="loadBalancerEnabled"
          name="loadBalancerEnabled"
          :value="loadBalancerEnabled"
          title="Loader Balance Enable"
          data-testid="edge-connectors-form__modules__load-balance-enabled-field"
        />
      </div>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="originShieldEnabled"
          name="originShieldEnabled"
          :value="originShieldEnabled"
          title="Origin Shield Enable"
          data-testid="edge-connectors-form__modules__origin-shield-enabled-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Addresses"
    description="Addresses a edge connectors."
    data-testid="edge-connectors-form__section__addresses"
    v-if="type !== 'live_ingest' && type !== 'edge_storage'"
  >
    <template #inputs>
      <div
        v-for="(address, index) in addresses"
        :key="index"
        class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Address"
            required
            description="IPv4/IPv6 address or CNAME to resolve"
            :value="addresses[index].value.address"
            :name="`addresses[${index}].address`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__address-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            label="Plain Port"
            required
            description=""
            :value="addresses[index].value.plainPort"
            :name="`addresses[${index}].plainPort`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__plain-port-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            label="TLS Port"
            required
            description=""
            :value="addresses[index].value.tlsPort"
            :name="`addresses[${index}].tlsPort`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__tls-port-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldDropdown
            label="Server Role"
            required
            :name="`addresses[${index}].serverRole`"
            :options="serversRoles"
            optionLabel="label"
            optionValue="value"
            :value="addresses[index].value.serverRole"
            appendTo="self"
            description=""
            data-testid="edge-connectors-form__addresses__server-role-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            label="Weight"
            required
            description="Weight used in load balancing strategy"
            :value="addresses[index].value.weight"
            :name="`addresses[${index}].weight`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__weight-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            label="Max Conns"
            required
            description="Maximum number of open connections per Edge Application instance"
            :value="addresses[index].value.maxConns"
            :name="`addresses[${index}].maxConns`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__max-conns-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            label="Max Fails"
            required
            description="Maximum number of communication attempts before marking as unavailable"
            :value="addresses[index].value.maxFails"
            :name="`addresses[${index}].maxFails`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__max-conns-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            label="Fail Timeout"
            required
            description="Timeout for communication attempts"
            :value="addresses[index].value.failTimeout"
            :name="`addresses[${index}].failTimeout`"
            placeholder=""
            data-testid="edge-connectors-form__addresses__fail-timeout-field"
          />
        </div>

        <div class="flex flex-col w-full gap-2">
          <FieldSwitchBlock
            :nameField="`addresses[${index}].active`"
            :name="`addresses[${index}].active`"
            auto
            :isCard="false"
            title="Active"
            :value="`addresses[${index}].value.active`"
            data-testid="edge-connectors-form__addresses__active-field"
          />
        </div>

        <div class="flex items-center gap-2">
          <Divider
            align="left"
            type="dashed"
            class="capitalize z-0"
            data-testid="edge-connectors-form__addresses__divider"
          >
          </Divider>

          <PrimeButton
            v-if="index !== 0"
            icon="pi pi-trash"
            size="small"
            outlined
            @click="removeAddresses(index)"
            data-testid="edge-connectors-form__addresses__remove-button"
          />
        </div>
      </div>

      <div>
        <PrimeButton
          icon="pi pi-plus-circle"
          label="Add Addresses"
          size="small"
          outlined
          @click="addNewAddresses"
          data-testid="edge-connectors-form__addresses__add-addresses-button"
          :disabled="!loadBalancerEnabled"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Timeouts"
    description="Timeout settings are pre-defined by Azion and can’t be customized."
    data-testid="edge-connectors-form__section__timeouts"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          label="Connection Timeout"
          description=""
          :value="connectionTimeout"
          name="connectionTimeout"
          placeholder=""
          required
          data-testid="edge-connectors-form__timeouts__connection-timeout-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          label="Read/Write Timeout"
          description=""
          :value="readWriteTimeout"
          name="readWriteTimeout"
          placeholder=""
          required
          data-testid="edge-connectors-form__timeouts__read-write-timeout-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          label="Max Retries"
          description=""
          :value="maxRetries"
          name="maxRetries"
          placeholder=""
          required
          data-testid="edge-connectors-form__timeouts__max-retries-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Status"
    data-testid="edge-connectors-form__section__status"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="status"
          name="status"
          auto
          :isCard="false"
          :value="status"
          title="Active"
          data-testid="edge-connectors-form__status__status-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { onMounted, ref, watch, computed } from 'vue'
  import { useField, useFieldArray } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import LabelBlock from '@/templates/label-block'
  import MultiSelect from 'primevue/multiselect'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'

  const types = ref([
    { label: 'HTTP', value: 'http' },
    { label: 'S3', value: 's3' },
    { label: 'Edge Storage', value: 'edge_storage' },
    { label: 'Live Ingest', value: 'live_ingest' }
  ])

  const loadBalancerMethods = ref([
    { label: 'Off', value: 'off' },
    { label: 'IP Hash', value: 'ip_hash' },
    { label: 'Least Connections', value: 'least_connections' },
    { label: 'Round Robin', value: 'round_robin' }
  ])

  const tlsRadioOptions = ref([
    { title: 'Preserve', inputValue: 'preserve' },
    { title: 'Off', inputValue: 'off' },
    { title: 'On', inputValue: 'on' }
  ])

  const connectionPreferences = ref([
    { label: 'IPv6', value: 'IPv6' },
    { label: 'IPv4', value: 'IPv4' }
  ])

  const liveIngestEndpoints = ref([
    { label: 'us-east-1.azioningest.net', value: 'us-east-1.azioningest.net' },
    { label: 'br-east-1.azioningest.net', value: 'br-east-1.azioningest.net' },
    { label: 'br-east-2.azioningest.net', value: 'br-east-2.azioningest.net' },
    { label: 'us-east-2.azioningest.net', value: 'us-east-2.azioningest.net' },
    { label: 'br-east-3.azioningest.net', value: 'br-east-3.azioningest.net' }
  ])

  const { value: name } = useField('name')
  const { value: type } = useField('type')
  const { value: loadBalanceMethod } = useField('loadBalanceMethod')
  const { value: tlsPolicy } = useField('tlsPolicy')
  const { value: connectionTimeout } = useField('connectionTimeout')
  const { value: readWriteTimeout } = useField('readWriteTimeout')
  const { value: maxRetries } = useField('maxRetries')
  const { value: connectionPreference } = useField('connectionPreference')
  const {
    push: pushAddresses,
    remove: removeAddressesArray,
    fields: addresses
  } = useFieldArray('addresses')
  const { value: status } = useField('status')
  const { value: loadBalancerEnabled } = useField('loadBalancerEnabled')
  const { value: originShieldEnabled } = useField('originShieldEnabled')

  // http
  const { value: host } = useField('http.host')
  const { value: path } = useField('http.path')
  const { value: followingRedirect } = useField('http.followingRedirect')
  const { value: realIpHeader } = useField('http.realIpHeader')
  const { value: realPortHeader } = useField('http.realPortHeader')

  // s3
  const { value: s3Host } = useField('s3.host')
  const { value: s3Bucket } = useField('s3.bucket')
  const { value: s3Path } = useField('s3.path')
  const { value: s3Region } = useField('s3.region')
  const { value: s3AccessKey } = useField('s3.accessKey')
  const { value: s3SecretKey } = useField('s3.secretKey')

  // edge_storage
  const { value: edgeStorageBucket } = useField('edgeStorage.bucket')
  const { value: edgeStoragePrefix } = useField('edgeStorage.prefix')

  // live_ingest
  const { value: liveIngestEndpoint } = useField('liveIngestEndpoint')

  const serversRoles = computed(() => {
    if (loadBalanceMethod.value === 'ip_hash') {
      return [{ label: 'Primary', value: 'primary' }]
    }

    return [
      { label: 'Primary', value: 'primary' },
      { label: 'Backup', value: 'backup' }
    ]
  })

  onMounted(() => {
    addNewAddresses()
  })

  const addNewAddresses = () => {
    pushAddresses({
      address: '',
      plainPort: 80,
      tlsPort: 443,
      serverRole: 'primary',
      weight: 1,
      active: true,
      maxConns: 0,
      maxFails: 1,
      failTimeout: 10
    })
  }

  const removeAddresses = (index) => {
    removeAddressesArray(index)
  }

  watch(loadBalancerEnabled, () => {
    if (!loadBalancerEnabled.value) {
      // eslint-disable-next-line id-length
      const newArray = addresses.value.filter((_, index) => index === 0)
      addresses.value = newArray
      loadBalanceMethod.value = 'off'
    }
  })

  watch(originShieldEnabled, () => {
    if (!originShieldEnabled.value) {
      tlsPolicy.value = 'preserve'
    }
  })
</script>
