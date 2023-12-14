<script setup>
  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField, useFieldArray } from 'vee-validate'
  import { computed } from 'vue'

  const ORIGIN_TYPES_OPTIONS = [
    {
      label: 'Single Origin',
      value: 'single_origin',
      disabled: false
    },
    {
      label: 'Load Balancer',
      value: 'load_balancer',
      disabled: false
    },
    {
      label: 'Live Ingest',
      value: 'live_ingest',
      disabled: true
    }
  ]

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

  const ORIGIN_PROTOCOL_POLICIES = [
    {
      label: 'Preserve HTTP/HTTPS protocol',
      value: 'preserve'
    },
    {
      label: 'Enforce HTTP',
      value: 'http'
    },
    {
      label: 'Enforce HTTPS',
      value: 'https'
    }
  ]

  const SERVER_ROLES = [
    {
      label: 'Primary',
      value: 'primary'
    },
    {
      label: 'Backup',
      value: 'backup'
    }
  ]

  //   {
  //         "name": "New Origin",
  //         "origin_type": "single_origin",
  //         "addresses": [
  //             {
  //                 "address": "httpbin.org"
  //             }
  //         ],
  //         "origin_protocol_policy": "http",
  //         "host_header": "${host}",
  //         "origin_path": "/requests",
  //         "hmac_authentication": false,
  //         "hmac_region_name": "",
  //         "hmac_access_key": "",
  //         "hmac_secret_key": ""
  // }

  const { value: originKey } = useField('originKey')
  const { value: name, errorMessage: nameError } = useField('name')
  const { value: hostHeader, errorMessage: hostHeaderError } = useField('hostHeader')
  const { push: pushAddress, remove: removeAddress, fields: addresses } = useFieldArray('addresses')
  const { value: originType } = useField('originType')
  const { value: originProtocolPolicy } = useField('originProtocolPolicy')
  // is_origin_redirection_enabled
  // const { value: isOriginRedirectionEnabled } = useField('isOriginRedirectionEnabled')
  const { value: method } = useField('method')
  const { value: originPath } = useField('originPath')
  const { value: connectionTimeout } = useField('connectionTimeout')
  const { value: timeoutBetweenBytes } = useField('timeoutBetweenBytes')
  const { value: hmacAuthentication } = useField('hmacAuthentication')
  const { value: hmacRegionName } = useField('hmacRegionName')
  const { value: hmacAccessKey } = useField('hmacAccessKey')
  const { value: hmacSecretKey } = useField('hmacSecretKey')

  // const { value: hmacRegionName, errorMessage: hmacRegionNameError } = useField('hmacRegionName')
  // const { value: hmacAccessKey, errorMessage: hmacAccessKeyError } = useField('hmacAccessKey')
  // const { value: hmacSecretKey, errorMessage: hmacSecretKeyError } = useField('hmacSecretKey')
  // const { value: originPath, errorMessage: originPathError } = useField('originPath')

  const isSingleOriginType = computed(() => originType.value === 'single_origin')
  const isLoadBalancerOriginType = computed(() => originType.value === 'load_balancer')
  const isHmacAuthentication = computed(() => !!hmacAuthentication.value)
  const isIpHashMethod = computed(() => method.value === 'ip_hash')

  const addAddress = () => {
    pushAddress({
      address: '',
      weight: 1,
      serverRole: 'primary',
      isActive: true
    })
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Edit the origin main settings."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Name *</label
        >
        <InputText
          placeholder="Insert the Origin Name"
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name to identify the origin.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Description
        </label>
        <InputText
          placeholder="Insert the Origin Name"
          v-model="description"
          type="text"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Origin Key"
    description="Save the origin to visualize the Key attributed by Azion to this configuration."
  >
    <template #inputs>
      <div
        class="flex w-full gap-6 items-end max-sm:flex-col max-sm:align-items-baseline flex-wrap max-sm:gap-3:flex-col"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-sm font-medium leading-5"
            >Key</label
          >
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i
              class="pi pi-lock text-color-secondary"
              v-if="!originKey"
            />
            <InputText
              class="w-full"
              v-model="originKey"
              id="name"
              type="text"
              :disabled="!originKey || disabledFields"
            />
          </span>
        </div>
        <PrimeButton
          class="h-8 max-sm:w-full"
          icon="pi pi-clone"
          outlined
          type="button"
          aria-label="Copy Origin Key"
          label="Copy to Clipboard"
          :disabled="!originKey"
          @click="$emit('copyOriginKey')"
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
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Type *</label
        >
        <Dropdown
          v-model="originType"
          :options="ORIGIN_TYPES_OPTIONS"
          optionLabel="label"
          option-value="value"
          :optionDisabled="(option) => option.disabled"
          :class="{ 'p-invalid': originTypeError }"
        />
        <small
          v-if="originTypeError"
          class="p-error text-xs font-normal leading-tight"
          >{{ originTypeError }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select an option to customize the origin.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Address *</label
        >
        <InputText
          placeholder="example.com"
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Define an origin for the content, in FQDN format or an IPv4/IPv6 address.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Host Header *</label
        >
        <InputText
          placeholder="${host_example}"
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Allow the origin to identify the virtualhost and locate the content or application. If
          this is blank, Azion will use the Address as the default.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Path</label
        >
        <InputText
          placeholder="/example.com/path/content.txt"
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Specify a custom path from which edge nodes will request the origin content. If this is
          blank, Azion will use the Address as the default.
        </small>
      </div>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <label class="text-color text-sm not-italic font-medium leading-5">Protocol Policy</label>
          <div class="flex flex-col gap-4">
            <div class="flex no-wrap gap-2 items-center">
              <RadioButton
                v-model="trigger"
                inputId="trigger-install"
                name="trigger-install"
                value="Install"
              />
              <label
                for="trigger-install"
                class="text-color text-sm font-normal leading-tight"
              >
                Preserve HTTP/HTTPS
              </label>
            </div>
            <div class="flex no-wrap gap-2 items-center">
              <RadioButton
                v-model="trigger"
                inputId="trigger-reload"
                name="trigger-reload"
                value="Reload"
              />
              <label
                for="trigger-reload"
                class="text-color text-sm font-normal leading-tight"
              >
                Enforce HTTP
              </label>
            </div>
            <div class="flex no-wrap gap-2 items-center">
              <RadioButton
                v-model="trigger"
                inputId="trigger-uninstall"
                name="trigger-uninstall"
                value="Uninstall"
              />
              <label
                for="trigger-uninstall"
                class="text-color text-sm font-normal leading-tight"
              >
                Enforce HTTPS
              </label>
            </div>
          </div>
          <small class="text-color-secondary text-xs not-italic font-normal leading-5">
            Select the type of connection between the edge nodes and the origin.
          </small>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Origins"
    description="Add one or more origns in your settings."
  >
    <template #inputs>
      <div
        class="flex flex-col items-start gap-6"
        v-for="(address, index) in addresses"
        :key="address.key"
      >
        <div class="flex flex-col w-full gap-2">
          <Divider
            class="px-3"
            align="left"
            type="dashed"
            v-if="index === 0"
          >
            <b>Then</b>
          </Divider>
          <div
            v-else
            class="flex gap-3"
          >
            <Divider
              class="px-3"
              align="left"
              type="dashed"
            >
              <b>And</b>
            </Divider>
            <PrimeButton
              class="h-8 max-sm:w-full position-absolute right-0 top-0"
              icon="pi pi-trash"
              outlined
              type="button"
              aria-label="Remove Origin"
              @click="removeAddress(index)"
            />
          </div>
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-sm font-medium leading-5"
            >Address *</label
          >
          <InputText
            placeholder="example.com"
            v-model="name"
            type="text"
            :class="{ 'p-invalid': nameError }"
          />
          <small
            v-if="nameError"
            class="p-error text-xs font-normal leading-tight"
            >{{ nameError }}</small
          >
          <small class="text-xs text-color-secondary font-normal leading-5">
            Define an origin for the content, in FQDN format or an IPv4/IPv6 address.
          </small>
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-sm font-medium leading-5"
            >Access Key *</label
          >
          <InputText
            v-model="name"
            type="text"
            :class="{ 'p-invalid': nameError }"
          />
          <small
            v-if="nameError"
            class="p-error text-xs font-normal leading-tight"
            >{{ nameError }}</small
          >
          <small class="text-xs text-color-secondary font-normal leading-5">
            Assigning Weights to the origins allows Load Balancer to determine how much traffic a
            server can handle in comparison with each other.The default or empty value is 1.
          </small>
        </div>
        <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
          <label
            for="name"
            class="text-color text-sm font-medium leading-5"
            >Weights</label
          >
          <InputNumber
            v-model="value2"
            inputId="minmax-buttons"
            mode="decimal"
            showButtons
            :min="0"
            :max="100"
            step="1"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Assigning to determine how much traffic a server can handle in comparison with each
            other.
          </small>
        </div>
        <div class="flex w-full gap-2 items-start">
          <InputSwitch
            v-model="active"
            inputId="activeStatus"
          />

          <label
            for="activeStatus"
            class="flex flex-col items-start gap-1"
          >
            <span class="text-color text-sm font-normal leading-5"> Active </span>
            <span class="text-sm text-color-secondary font-normal leading-5"> Description</span>
          </label>
        </div>
      </div>
      <div class="flex flex-col w-full gap-2">
        <Divider />
      </div>
      <div>
        <PrimeButton
          class="h-8 max-sm:w-full"
          icon="pi pi-plus-circle"
          outlined
          type="button"
          aria-label="New Origin"
          label="New Origin"
          @click="addAddress"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="HMAC authentication"
    description="Provide HMAC authentication credentials to deliver private content."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg items-start gap-2 pb-3 pt-2">
            <InputSwitch
              v-model="active"
              inputId="activeStatus"
            />
            <label
              for="activeStatus"
              class="text-color text-sm font-normal leading-5"
              >Active</label
            >
          </span>
        </div>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Region name *</label
        >
        <InputText
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Enter the Region supported by the object storage provider.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Access Key *</label
        >
        <InputText
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Enter the Access Key provided by the object storage provider.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5"
          >Secret Key *</label
        >
        <InputText
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Enter the Secret Key provided by the object storage provider.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Timeouts"
    description="The timeout settings are pre-defined by Azion and can’t be customized."
  >
    <template #inputs>
      <div class="w-full flex max-sm:flex-col gap-8 max-md:gap-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-sm font-medium leading-5"
            >Connection</label
          >
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock text-color-secondary" />
            <InputText
              class="w-full"
              placeholder="60 seconds"
              type="text"
              disabled
            />
          </span>
          <small class="text-xs text-color-secondary font-normal leading-5">
            The amount of time that Azion will wait for a response from the origin before showing an
            error.
          </small>
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-sm font-medium leading-5"
          >
            Between bytes
          </label>
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock text-color-secondary" />
            <InputText
              class="w-full"
              placeholder="120 bytes"
              type="text"
              disabled
            />
          </span>
          <small class="text-xs text-color-secondary font-normal leading-5">
            The amount of time that Azion will wait between receiving two packets of a response from
            the origin.
          </small>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
