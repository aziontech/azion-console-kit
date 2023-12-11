<script setup>
  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Card from 'primevue/card'
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

  const { value: originType } = useField('originType')
  const { value: method } = useField('method')
  const { value: originProtocolPolicy } = useField('originProtocolPolicy')
  const { value: hmacAuthentication } = useField('hmacAuthentication')
  const { value: connectionTimeout } = useField('connectionTimeout')
  const { value: timeoutBetweenBytes } = useField('timeoutBetweenBytes')
  const { push: pushAddress, fields: addresses } = useFieldArray('addresses')

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: hostHeader, errorMessage: hostHeaderError } = useField('hostHeader')
  const { value: hmacRegionName, errorMessage: hmacRegionNameError } = useField('hmacRegionName')
  const { value: hmacAccessKey, errorMessage: hmacAccessKeyError } = useField('hmacAccessKey')
  const { value: hmacSecretKey, errorMessage: hmacSecretKeyError } = useField('hmacSecretKey')
  const { value: originPath, errorMessage: originPathError } = useField('originPath')

  function addAddress() {
    pushAddress({
      address: '',
      weight: 1,
      serverRole: 'primary',
      isActive: true
    })
  }

  const isSingleOriginType = computed(() => originType.value === 'single_origin')
  const isLoadBalancerOriginType = computed(() => originType.value === 'load_balancer')
  const isHmacAuthentication = computed(() => !!hmacAuthentication.value)
  const isIpHashMethod = computed(() => method.value === 'ip_hash')
</script>

<template>
  <FormHorizontal title="General Configuration">
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Origin Name *</label
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
      </div>

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="origin-type"
          class="text-color text-base font-medium"
          >Origin Type *</label
        >
        <Dropdown
          v-model="originType"
          :options="ORIGIN_TYPES_OPTIONS"
          optionLabel="label"
          option-value="value"
          :optionDisabled="(option) => option.disabled"
        />
      </div>

      <!-- Custom form for Origin Type : Single Origin  -->
      <section v-if="isSingleOriginType"></section>
      <!-- Custom form for Origin Type : Load Balancer -->
      <section v-if="isLoadBalancerOriginType">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="method"
            class="text-color text-base font-medium"
            >Method *</label
          >
          <Dropdown
            v-model="method"
            :options="METHOD_TYPES_OPTIONS"
            optionLabel="label"
            option-value="value"
          />
        </div>
      </section>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="host-header"
          class="text-color text-base font-medium"
          >Host Header *</label
        >
        <InputText
          id="hostHeader"
          v-model="hostHeader"
          type="text"
          :class="{ 'p-invalid': hostHeaderError }"
        />
        <small
          v-if="hostHeaderError"
          class="p-error text-xs font-normal leading-tight"
          >{{ hostHeaderError }}</small
        >
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="origin-path"
          class="text-color text-base font-medium"
          >Origin Path *</label
        >
        <InputText
          v-model="originPath"
          type="text"
          :class="{ 'p-invalid': originPathError }"
        />
        <div class="text-color-secondary text-sm font-normal">
          Azion can request your content from a directory in your origin. Azion appends Origin Path
          to the URI when forwarding the request to your origin. Leave it in blank to use only the
          URI.
        </div>
        <small
          v-if="originPathError"
          class="p-error text-xs font-normal leading-tight"
          >{{ originPathError }}</small
        >
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-color text-base font-medium">Origin Protocol Policy</label>
        <div class="flex flex-col gap-3">
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
            v-for="policy in ORIGIN_PROTOCOL_POLICIES"
            :key="policy.value"
          >
            <template #title>
              <span class="text-base">{{ policy.label }}</span>
              <RadioButton
                v-model="originProtocolPolicy"
                :inputId="policy.value"
                name="originProtocolPolicy"
                :value="policy.value"
              />
            </template>
          </Card>
          <div class="text-color-secondary text-sm font-normal">
            Check the protocol you want to use in the connection to the origin.
          </div>
        </div>
      </div>

      <div
        v-for="(address, index) in addresses"
        :key="index"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="address"
            class="text-color text-base font-medium"
            >Address *</label
          >
          <InputText
            required
            v-model="address.value.address"
            type="text"
          />
          <div class="text-color-secondary text-sm font-normal">
            Specify the domain name (FQDN) or IPV4/IPV6 for your origin. An origin is a web server
            from which you want Azion to get your content. If your origin does not use standard
            ports (80/HTTP and 443/HTTPS) you can use the domain:port notation in this field.
          </div>
        </div>

        <div v-if="isLoadBalancerOriginType">
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="weight"
              class="text-color text-base font-medium"
              >Weight</label
            >
            <InputNumber
              showButtons
              :min="1"
              :max="10"
              id="weight"
              v-model="address.value.weight"
              aria-describedby="weight-help"
            />
            <div class="text-color-secondary text-sm font-normal">
              Assigning Weights to the origins allows Load Balancer to determine how much traffic a
              server can handle in comparison with each other. The default or empty value is 1.
            </div>
          </div>

          <div
            class="flex flex-col gap-2"
            v-if="!isIpHashMethod"
          >
            <label class="text-color text-base font-medium">Server Role</label>
            <div class="flex flex-col gap-3">
              <Card
                :pt="{
                  body: { class: 'p-4' },
                  title: { class: 'flex justify-between  text-base m-0 font-medium' },
                  subtitle: {
                    class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                  }
                }"
                v-for="role in SERVER_ROLES"
                :key="role.value"
              >
                <template #title>
                  <span class="text-base">{{ role.label }}</span>
                  <RadioButton
                    v-model="address.value.serverRole"
                    :inputId="role.value"
                    name="serverRole"
                    :value="role.value"
                  />
                </template>
              </Card>
              <div class="text-color-secondary text-sm font-normal">
                Assigning Weights to the origins allows Load Balancer to determine how much traffic
                a server can handle in comparison with each other. The default or empty value is 1
              </div>
            </div>
          </div>

          <Card
            :pt="{
              root: { class: 'shadow-none  rounded-none' },
              body: { class: 'py-4 border-0' },
              title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <InputSwitch
                inputId="active"
                v-model="address.value.isActive"
              />
              <div class="flex-col gap-1">
                <div class="">
                  <div class="text-color text-sm font-normal">Active</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
      <PrimeButton
        v-if="isLoadBalancerOriginType"
        class="justify-center flex w-full"
        icon-pos="center"
        icon="pi pi-plus"
        label="Origin"
        @click="addAddress"
      />

      <div v-if="isSingleOriginType">
        <Card
          :pt="{
            root: { class: 'shadow-none  rounded-none' },
            body: { class: 'py-4 border-0' },
            title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
            subtitle: {
              class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
            }
          }"
        >
          <template #title>
            <InputSwitch
              inputId="hmac"
              v-model="hmacAuthentication"
            />
            <div class="flex-col gap-1">
              <div class="">
                <div
                  class="text-color text-sm font-normal"
                  for="hmac"
                >
                  HMAC Authentication
                </div>
              </div>
            </div>
          </template>
        </Card>

        <div v-if="isHmacAuthentication">
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="region-name"
              class="text-color text-base font-medium"
              >Region Name *</label
            >
            <InputText
              required
              v-model="hmacRegionName"
              type="text"
              :class="{ 'p-invalid': hmacRegionNameError }"
            />
            <small
              v-if="hmacRegionNameError"
              class="p-error text-xs font-normal leading-tight"
              >{{ hmacRegionNameError }}</small
            >
          </div>

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="access-key"
              class="text-color text-base font-medium"
              >Access Key *</label
            >
            <InputText
              required
              v-model="hmacAccessKey"
              type="text"
              :class="{ 'p-invalid': hmacAccessKeyError }"
            />
            <small
              v-if="hmacAccessKeyError"
              class="p-error text-xs font-normal leading-tight"
              >{{ hmacAccessKeyError }}</small
            >
          </div>

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="secret-key"
              class="text-color text-base font-medium"
              >Secret Key *</label
            >
            <InputText
              required
              v-model="hmacSecretKey"
              type="text"
              :class="{ 'p-invalid': hmacSecretKeyError }"
            />
            <small
              v-if="hmacSecretKeyError"
              class="p-error text-xs font-normal leading-tight"
              >{{ hmacSecretKeyError }}</small
            >
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal title="Timeouts">
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="connection"
          class="text-color text-base font-medium"
          >Connection (Seconds)</label
        >
        <InputNumber
          suffix="s"
          :min="1"
          :max="75"
          disabled
          id="connectionInSeconds"
          v-model="connectionTimeout"
        />
        <div class="text-color-secondary text-sm font-normal">
          This timeout cannot usually exceed 75 seconds. Change it carefully!
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="between"
          class="text-color text-base font-medium"
          >Between Bytes (Seconds)</label
        >
        <InputNumber
          suffix="s"
          :min="1"
          disabled
          v-model="timeoutBetweenBytes"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
