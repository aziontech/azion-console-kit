<template>
  <div>
    <CreateFormBlock
      pageTitle="Create Origins"
      :createService="createOrigin"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
    >
      <template #form>
        <label>Origin Name</label>

        <InputText
          placeholder="Insert the Origin Name"
          v-bind="name"
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="{ value: errors.name, showDelay: 200 }"
        />

        <b>General Configuration</b>
        <label>Origin Type</label>
        <Dropdown
          v-model="originType"
          :options="ORIGIN_TYPES_OPTIONS"
          optionLabel="label"
          option-value="value"
          :optionDisabled="(option) => option.disabled"
          @change="changeOriginType"
        />

        <!-- Custom form for Origin Type : Single Origin  -->
        <template v-if="isSingleOriginType"></template>

        <!-- Custom form for Origin Type : Load Balancer -->
        <template v-if="isLoadBalancerOriginType">
          <label>Method *</label>
          <Dropdown
            v-model="method"
            :options="METHOD_TYPES_OPTIONS"
            optionLabel="label"
            option-value="value"
          />
        </template>

        <label>Host Header</label>
        <div class="flex flex-column gap-2">
          <InputText
            id="hostHeader"
            v-bind="hostHeader"
            type="text"
            :class="{ 'p-invalid': errors.hostHeader }"
            v-tooltip.top="{ value: errors.hostHeader, showDelay: 200 }"
          />
          <small>Type the host header for the CDN to pass to the origin server.</small>
        </div>

        <label>Origin Path</label>
        <div class="flex flex-column gap-2">
          <InputText
            v-bind="originPath"
            type="text"
            :class="{ 'p-invalid': errors.originPath }"
            v-tooltip.top="{ value: errors.originPath, showDelay: 200 }"
          />
          <small
            >Azion can request your content from a directory in your origin. Azion appends Origin
            Path to the URI when forwarding the request to your origin. Leave it in blank to use
            only the URI.</small
          >
        </div>

        <label>Origin Protocol Policy</label>
        <div class="flex flex-column gap-2">
          <div
            v-for="policy in ORIGIN_PROTOCOL_POLICIES"
            :key="policy.value"
            class="flex items-center"
          >
            <RadioButton
              v-model="originProtocolPolicy"
              :inputId="policy.value"
              name="originProtocolPolicy"
              :value="policy.value"
            />
            <label
              :for="policy.value"
              class="ml-2"
              >{{ policy.label }}</label
            >
          </div>
        </div>
        <small>Check the protocol you want to use in the connection to the origin.</small>

        <template
          v-for="(address, index) in addresses"
          :key="index"
        >
          <label for="address">Address *</label>
          <div class="flex flex-column gap-2">
            <InputText
              required
              v-model="address.value.address"
              type="text"
            />
            <small>
              Specify the domain name (FQDN) or IPV4/IPV6 for your origin. An origin is a web server
              from which you want Azion to get your content. If your origin does not use standard
              ports (80/HTTP and 443/HTTPS) you can use the domain:port notation in this field.
            </small>
          </div>

          <template v-if="isLoadBalancerOriginType">
            <label>Weight</label>
            <div class="flex flex-column gap-2">
              <InputNumber
                showButtons
                :min="1"
                :max="10"
                id="weight"
                v-model="address.value.weight"
                aria-describedby="weight-help"
              />
              <small>
                Assigning Weights to the origins allows Load Balancer to determine how much traffic
                a server can handle in comparison with each other. The default or empty value is 1.
              </small>
            </div>

            <template v-if="method !== 'ip_hash'">
              <label>Server Role</label>
              <div>
                <div
                  v-for="role in SERVER_ROLES"
                  :key="role.value"
                  class="flex items-center"
                >
                  <RadioButton
                    v-model="address.value.server_role"
                    :inputId="role.value"
                    name="server_role"
                    :value="role.value"
                  />
                  <label
                    :for="role.value"
                    class="ml-2"
                    >{{ role.label }}</label
                  >
                </div>
              </div>
            </template>

            <div class="flex items-center">
              <InputSwitch
                inputId="active"
                v-model="address.value.is_active"
              />
              <label
                for="active"
                class="ml-2"
                >Active</label
              >
            </div>

            <Divider type="dashed" />
          </template>
        </template>
        <PrimeButton
          v-if="isLoadBalancerOriginType"
          class="justify-center flex w-full"
          icon-pos="center"
          icon="pi pi-plus"
          label="Origin"
          @click="addAddress"
        >
        </PrimeButton>

        <template v-if="isSingleOriginType">
          <div class="flex items-center">
            <InputSwitch
              inputId="hmac"
              v-model="hmacAuthentication"
            />
            <label
              for="hmac"
              class="ml-2"
              >HMAC Authentication</label
            >
          </div>

          <template v-if="!!hmacAuthentication">
            <label>Region Name *</label>
            <InputText
              required
              v-bind="hmacRegionName"
              type="text"
              :class="{ 'p-invalid': errors.hmacRegionName }"
              v-tooltip.top="{ value: errors.hmacRegionName, showDelay: 200 }"
            />

            <label>Access Key *</label>
            <InputText
              required
              v-bind="hmacAccessKey"
              type="text"
              :class="{ 'p-invalid': errors.hmacAccessKey }"
              v-tooltip.top="{ value: errors.hmacAccessKey, showDelay: 200 }"
            />

            <label>Secret Key *</label>
            <InputText
              required
              v-bind="hmacSecretKey"
              type="text"
              :class="{ 'p-invalid': errors.hmacSecretKey }"
              v-tooltip.top="{ value: errors.hmacSecretKey, showDelay: 200 }"
            />
          </template>
        </template>

        <b>Timeouts</b>

        <label>Connection (Seconds)</label>
        <InputNumber
          suffix="s"
          min="1"
          max="75"
          disabled
          id="connectionInSeconds"
          v-model="connectionTimeout"
        />
        <small>This timeout cannot usually exceed 75 seconds. Change it carefully!</small>

        <label>Between Bytes (Seconds)</label>
        <InputNumber
          suffix="s"
          min="1"
          disabled
          v-model="timeoutBetweenBytes"
        />
      </template>
    </CreateFormBlock>
  </div>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import { useForm, useField, useFieldArray } from 'vee-validate'
  import { computed } from 'vue'
  import * as yup from 'yup'

  import InputText from 'primevue/inputtext'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'

  const props = defineProps({
    createOriginService: {
      type: Function,
      required: true
    }
  })

  async function createOrigin() {
    const { id } = this.$route.params
    return await props.createOriginService(values, id)
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

  const { defineInputBinds, errors, meta, resetForm, values } = useForm({
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
