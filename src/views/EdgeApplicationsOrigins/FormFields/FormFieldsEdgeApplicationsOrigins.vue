<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import InputNumber from 'primevue/inputnumber'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField, useFieldArray } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    },
    copyToClipboard: {
      type: Function,
      required: true
    },
    listOrigins: {
      required: true,
      type: Array
    },
    generatedOriginKey: {
      type: String,
      required: false
    },
    isEditMode: {
      type: Boolean,
      default: false
    }
  })

  const METHOD_TYPES_OPTIONS = [
    {
      label: 'IP Hash',
      value: 'ip_hash'
    },
    {
      label: 'Least connections',
      value: 'least_connections'
    },
    {
      label: 'Round-Robin',
      value: 'round_robin'
    }
  ]
  const policyProtocolRadioOptions = [
    { title: 'Preserve HTTP/HTTPS', inputValue: 'preserve' },
    { title: 'Enforce HTTP', inputValue: 'http' },
    { title: 'Enforce HTTPS', inputValue: 'https' }
  ]

  const serverRolesRadioOptions = [
    { title: 'Primary', inputValue: 'primary' },
    { title: 'Backup', inputValue: 'backup' }
  ]

  const STREAMING_ENDPOINT_OPTIONS = [
    'br-east-1.azioningest.net',
    'br-east-2.azioningest.net',
    'br-east-3.azioningest.net',
    'us-east-1.azioningest.net',
    'us-east-2.azioningest.net'
  ]

  const originKeyInput = ref(null)

  const { value: originKey, setValue: setOriginKey } = useField('originKey')
  const { value: name } = useField('name')
  const { value: hostHeader } = useField('hostHeader')
  const {
    push: pushAddress,
    remove: removeAddress,
    replace: resetAddresses,
    fields: addresses
  } = useFieldArray('addresses')
  const { value: originType } = useField('originType')
  useField('originProtocolPolicy')
  const { value: method } = useField('method')
  const { value: streamingEndpoint } = useField('streamingEndpoint')
  const { value: originPath } = useField('originPath')
  const { value: connectionTimeout } = useField('connectionTimeout')
  const { value: timeoutBetweenBytes } = useField('timeoutBetweenBytes')
  const { value: hmacAuthentication } = useField('hmacAuthentication')
  const { value: hmacRegionName } = useField('hmacRegionName')
  const { value: hmacAccessKey } = useField('hmacAccessKey')
  const { value: hmacSecretKey } = useField('hmacSecretKey')
  const { value: bucketName } = useField('bucketName')
  const { value: prefix } = useField('prefix')

  const isSingleOriginType = computed(() => originType.value === 'single_origin')
  const isLiveIngestOriginType = computed(() => originType.value === 'live_ingest')
  const isLoadBalancerOriginType = computed(() => originType.value === 'load_balancer')
  const isObjectStorageOriginType = computed(() => originType.value === 'object_storage')
  const isHmacAuthentication = computed(() => !!hmacAuthentication.value)
  const isIpHashMethod = computed(() => method.value === 'ip_hash')

  const defaultAddressSingleOrigin = {
    address: '',
    serverRole: 'primary',
    isActive: true
  }
  const defaultAddress = { ...defaultAddressSingleOrigin, weight: 1 }

  const resetAddressesFields = (option) => {
    resetAddresses(
      option.value === 'load_balancer'
        ? [{ ...defaultAddress }]
        : [{ ...defaultAddressSingleOrigin }]
    )
    if (option.value === 'load_balancer') {
      method.value = 'ip_hash'
      pushAddress({ ...defaultAddress })
    }
  }

  const removeCurrentAddress = (index) => {
    removeAddress(index)
    if (addresses.value.length === 1) {
      pushAddress({ ...defaultAddress })
    }
  }

  const addAddress = () => {
    pushAddress({ ...defaultAddress })
  }

  const scrollOriginKey = () => {
    originKeyInput.value.inputRef.$el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const descriptionOriginType = computed(() => {
    return isLoadBalancerOriginType.value ? '' : 'Select an option to customize the origin.'
  })

  watch(
    () => props.generatedOriginKey,
    (value) => {
      setOriginKey(value)
    }
  )

  defineExpose({
    scrollOriginKey
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Create a origin server configuration for the edge application. Use Rules Engine to activate origins."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          placeholder="My origin"
          name="name"
          :value="name"
          data-testid="form-horizontal-general-name"
          description="Give a unique and descriptive name to identify the origin."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    v-if="isEditMode"
    :isDrawer="true"
    title="Origin Key"
    description="Save the origin to visualize the key attributed by Azion to this configuration."
  >
    <template #inputs>
      <div
        class="flex w-full gap-6 items-end max-sm:flex-col max-sm:align-items-baseline flex-wrap max-sm:gap-3:flex-col"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Key"
            name="originKey"
            :value="originKey"
            disabled
            ref="originKeyInput"
            icon="pi pi-lock"
          />
        </div>
        <PrimeButton
          class="h-8 max-sm:w-full"
          icon="pi pi-clone"
          outlined
          type="button"
          aria-label="Copy Origin Key"
          label="Copy"
          :disabled="!originKey"
          @click="props.copyToClipboard(originKey)"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Host Settings"
    description="Customize settings related to origin servers and hosts."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <FieldDropdown
          label="Type"
          required
          name="originType"
          :options="props.listOrigins"
          :loading="!props.listOrigins"
          @change="resetAddressesFields"
          optionValue="value"
          optionLabel="label"
          :value="originType"
          inputId="originType"
          data-testid="origin-form__origin-type"
          :optionDisabled="(option) => option.disabled"
          :description="descriptionOriginType"
        />
      </div>
      <div
        v-if="isLiveIngestOriginType"
        class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full"
      >
        <FieldDropdown
          label="Streaming Endpoint"
          required
          name="streamingEndpoint"
          :options="STREAMING_ENDPOINT_OPTIONS"
          :value="streamingEndpoint"
          inputId="streamingEndpoint"
          data-testid="origin-form__streaming-endpoint"
          description="Select an HLS streaming endpoint used by your live stream."
        />
      </div>
      <div v-if="!isObjectStorageOriginType && !isLiveIngestOriginType">
        <FieldGroupRadio
          label="Protocol Policy"
          nameField="originProtocolPolicy"
          :isCard="false"
          :options="policyProtocolRadioOptions"
          helpText="Select the protocol usage between the edge nodes and the origin."
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isLoadBalancerOriginType"
      >
        <FieldDropdown
          label="Method"
          required
          name="method"
          :options="METHOD_TYPES_OPTIONS"
          optionValue="value"
          optionLabel="label"
          :value="method"
          inputId="method"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isSingleOriginType"
      >
        <FieldText
          label="Address"
          required
          placeholder="example.com"
          name="addresses[0].address"
          :value="addresses[0].value.address"
          data-testid="origin-form__address"
          description="Define an origin for the content in FQDN format or an IPv4/IPv6 address."
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="!isObjectStorageOriginType && !isLiveIngestOriginType"
      >
        <FieldText
          label="Host Header"
          required
          placeholder="${host}"
          name="hostHeader"
          :value="hostHeader"
          description="Identify a virtualhost sent in the Host header to the origin."
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="!isObjectStorageOriginType && !isLiveIngestOriginType"
      >
        <FieldText
          label="Path"
          placeholder="/path"
          name="originPath"
          :value="originPath"
          description="Specify a custom path from which edge nodes will request the origin content. If this is
          blank, Azion will use the Address as the default."
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isObjectStorageOriginType"
      >
        <FieldText
          label="Bucket Name"
          required
          name="bucketName"
          :value="bucketName"
          description="Name of the bucket created using Azion Edge Storage."
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-if="isObjectStorageOriginType"
      >
        <FieldText
          label="Prefix"
          name="prefix"
          :value="prefix"
          description="Path or directory within the bucket that will serve as the origin. Leave blank if you want to use the root directory."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    v-if="isLoadBalancerOriginType"
    :isDrawer="true"
    title="Origins"
    description="Add one or more origins in your settings."
  >
    <template #inputs>
      <div
        class="flex flex-col items-start gap-6"
        v-for="(address, index) in addresses"
        :key="address.key"
      >
        <div class="flex flex-col w-full gap-2">
          <Divider
            class="px-3 z-0"
            align="left"
            type="dashed"
            v-if="address.isFirst"
          >
            Then
          </Divider>
          <div
            v-else
            class="flex gap-3"
          >
            <Divider
              class="px-3 z-0"
              align="left"
              type="dashed"
            >
              And
            </Divider>
            <PrimeButton
              class="h-8 max-sm:w-full position-absolute right-0 top-0"
              icon="pi pi-trash"
              outlined
              type="button"
              aria-label="Remove Origin"
              @click="removeCurrentAddress(index)"
            />
          </div>
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Address"
            required
            placeholder="example.com"
            :data-testid="`origin-form__address-${index}`"
            :name="`addresses[${index}].address`"
            :value="addresses[index].value.address"
            description="Define an origin for the content, in FQDN format or an IPv4/IPv6 address."
          />
        </div>
        <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
          <label
            :for="`${address.key}-weight`"
            class="text-color text-sm font-medium leading-5"
            >Weights</label
          >
          <InputNumber
            v-model="address.value.weight"
            :inputId="`${address.key}-weight`"
            mode="decimal"
            showButtons
            :min="0"
            :max="10"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Assign a number from 0 to 10 to determine how much traffic this origin server can
            handle.
          </small>
        </div>
        <div v-if="!isIpHashMethod">
          <FieldGroupRadio
            label="Server Role"
            :nameField="`addresses[${index}].serverRole`"
            :isCard="false"
            :options="serverRolesRadioOptions"
            helpText="Backup servers only receive HTTP requests if all primary servers are unavailable."
          />
        </div>

        <FieldSwitchBlock
          :nameField="`addresses[${index}].isActive`"
          :name="`${address.key}-active`"
          auto
          :isCard="false"
          title="Active"
        />
      </div>
      <div class="flex flex-col w-full gap-2">
        <Divider type="dashed" />
      </div>
      <div>
        <PrimeButton
          class="h-8 max-sm:w-full"
          icon="pi pi-plus-circle"
          outlined
          type="button"
          aria-label="Add Origin"
          label="Add Origin"
          @click="addAddress"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    v-if="isSingleOriginType"
    title="HMAC authentication"
    description="Provide HMAC authentication credentials to deliver private content."
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="hmacAuthentication"
        name="hmacAuthentication"
        auto
        :isCard="false"
        title="Active"
      />
      <div
        class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
        v-if="isHmacAuthentication"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Region Name"
            required
            name="hmacRegionName"
            :value="hmacRegionName"
            description="Enter the Region supported by the object storage provider."
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Access Key"
            required
            name="hmacAccessKey"
            :value="hmacAccessKey"
            description="Enter the Access Key provided by the object storage provider."
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Secret Key"
            required
            name="hmacSecretKey"
            :value="hmacSecretKey"
            description="Enter the Secret Key provided by the object storage provider."
          />
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Timeouts"
    description="Timeout settings are pre-defined by Azion and can’t be customized."
    v-if="!isObjectStorageOriginType && !isLiveIngestOriginType"
  >
    <template #inputs>
      <div class="w-full flex max-sm:flex-col gap-8 max-md:gap-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Connection"
            name="connectionTimeout"
            :value="`${connectionTimeout}`"
            disabled
            placeholder="60 seconds"
            icon="pi pi-lock"
            description="The amount of time that Azion will wait for a response from the origin before showing an error."
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Between bytes"
            name="timeoutBetweenBytes"
            :value="`${timeoutBetweenBytes}`"
            disabled
            placeholder="120 bytes"
            icon="pi pi-lock"
            description="The amount of time that Azion will wait between receiving two packets of a response from the origin."
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
