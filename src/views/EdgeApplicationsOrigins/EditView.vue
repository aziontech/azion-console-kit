<template>
  <div>
    <EditFormBlock
      pageTitle="Edit Origins"
      :editService="editOrigin"
      :loadService="loadOrigin"
      :initialDataSetter="setValues"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
    >
      <template #form>
        <FormHorizontal title="General Configuration">
          <template #inputs>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="name"
                class="text-color text-base font-medium"
                >Origin Name *</label
              >
              <InputText
                placeholder="Insert the Origin Name"
                v-bind="name"
                type="text"
                :class="{ 'p-invalid': errors.name }"
              />
              <small
                v-if="errors.name"
                class="p-error text-xs font-normal leading-tight"
                >{{ errors.name }}</small
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
                v-bind="hostHeader"
                type="text"
                :class="{ 'p-invalid': errors.hostHeader }"
              />
              <small
                v-if="errors.hostHeader"
                class="p-error text-xs font-normal leading-tight"
                >{{ errors.hostHeader }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="origin-path"
                class="text-color text-base font-medium"
                >Origin Path *</label
              >
              <InputText
                v-bind="originPath"
                type="text"
                :class="{ 'p-invalid': errors.originPath }"
              />
              <div class="text-color-secondary text-sm font-normal">
                Azion can request your content from a directory in your origin. Azion appends Origin
                Path to the URI when forwarding the request to your origin. Leave it in blank to use
                only the URI.
              </div>
              <small
                v-if="errors.originPath"
                class="p-error text-xs font-normal leading-tight"
                >{{ errors.originPath }}</small
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
                  Specify the domain name (FQDN) or IPV4/IPV6 for your origin. An origin is a web
                  server from which you want Azion to get your content. If your origin does not use
                  standard ports (80/HTTP and 443/HTTPS) you can use the domain:port notation in
                  this field.
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
                    Assigning Weights to the origins allows Load Balancer to determine how much
                    traffic a server can handle in comparison with each other. The default or empty
                    value is 1.
                  </div>
                </div>

                <div
                  class="flex flex-col gap-2"
                  v-if="method !== 'ip_hash'"
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
                          v-model="address.value.server_role"
                          :inputId="role.value"
                          name="server_role"
                          :value="role.value"
                        />
                      </template>
                    </Card>
                    <div class="text-color-secondary text-sm font-normal">
                      Assigning Weights to the origins allows Load Balancer to determine how much
                      traffic a server can handle in comparison with each other. The default or
                      empty value is 1
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
                      v-model="address.value.is_active"
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

              <div v-if="!!hmacAuthentication">
                <div class="flex flex-col sm:max-w-lg w-full gap-2">
                  <label
                    for="region-name"
                    class="text-color text-base font-medium"
                    >Region Name *</label
                  >
                  <InputText
                    required
                    v-bind="hmacRegionName"
                    type="text"
                    :class="{ 'p-invalid': errors.hmacRegionName }"
                  />
                  <small
                    v-if="errors.hmacRegionName"
                    class="p-error text-xs font-normal leading-tight"
                    >{{ errors.hmacRegionName }}</small
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
                    v-bind="hmacAccessKey"
                    type="text"
                    :class="{ 'p-invalid': errors.hmacAccessKey }"
                  />
                  <small
                    v-if="errors.hmacAccessKey"
                    class="p-error text-xs font-normal leading-tight"
                    >{{ errors.hmacAccessKey }}</small
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
                    v-bind="hmacSecretKey"
                    type="text"
                    :class="{ 'p-invalid': errors.hmacSecretKey }"
                  />
                  <small
                    v-if="errors.hmacSecretKey"
                    class="p-error text-xs font-normal leading-tight"
                    >{{ errors.hmacSecretKey }}</small
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
    </EditFormBlock>
  </div>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import { useForm, useField, useFieldArray } from 'vee-validate'
  import { computed } from 'vue'
  import * as yup from 'yup'

  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Card from 'primevue/card'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  const props = defineProps({
    editOriginService: {
      type: Function,
      required: true
    },
    loadOriginService: {
      type: Function,
      required: true
    }
  })

  async function editOrigin() {
    const { id } = this.$route.params
    return await props.editOriginService(values, id)
  }
  async function loadOrigin() {
    const { id, originKey } = this.$route.params
    return await props.loadOriginService({ id, originKey })
  }

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

  const validationSchema = yup.object({
    name: yup.string().required(),
    addresses: yup.array().of(
      yup.object().shape({
        address: yup.string().required(),
        is_active: yup.boolean()
      })
    )
  })

  const { defineInputBinds, errors, meta, resetForm, values, setValues } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      hostHeader: '${host}',
      method: 'ip_hash',
      originPath: '',
      addresses: [
        {
          address: '',
          weight: 1,
          server_role: 'primary',
          is_active: true
        }
      ],
      originProtocolPolicy: 'preserve',
      originType: 'load_balancer',
      key: '',
      hmacAuthentication: false,
      hmacRegionName: '',
      hmacAccessKey: '',
      hmacSecretKey: '',
      connectionTimeout: 60,
      timeoutBetweenBytes: 120
    }
  })

  const { value: originType } = useField('originType')
  const { value: method } = useField('method')
  const { value: originProtocolPolicy } = useField('originProtocolPolicy')
  const { value: hmacAuthentication } = useField('hmacAuthentication')
  const { value: connectionTimeout } = useField('connectionTimeout')
  const { value: timeoutBetweenBytes } = useField('timeoutBetweenBytes')
  const { push: pushAddress, fields: addresses } = useFieldArray('addresses')

  const name = defineInputBinds('name', { validateOnInput: true })
  const hostHeader = defineInputBinds('hostHeader', { validateOnInput: true })
  const hmacRegionName = defineInputBinds('hmacRegionName', { validateOnInput: true })
  const hmacAccessKey = defineInputBinds('hmacAccessKey', { validateOnInput: true })
  const hmacSecretKey = defineInputBinds('hmacSecretKey', { validateOnInput: true })
  const originPath = defineInputBinds('originPath', { validateOnInput: true })

  const isSingleOriginType = computed(() => originType.value === 'single_origin')
  const isLoadBalancerOriginType = computed(() => originType.value === 'load_balancer')

  function addAddress() {
    pushAddress({
      address: '',
      weight: 1,
      server_role: 'primary',
      is_active: true
    })
  }
</script>
