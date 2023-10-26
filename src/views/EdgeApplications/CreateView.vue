<template>
  <div>
    <CreateFormBlock
      pageTitle="Create Edge Applications"
      :createService="props.createEdgeApplicationService"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
    >
      <template #form>
        <label>Edge Application Name: *</label>
        <InputText
          placeholder="Insert the Edge Application Name"
          v-bind="name"
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="{ value: errors.name, showDelay: 200 }"
        />

        <Divider />
        <b>Main Settings</b>

        <label>Delivery Protocol</label>
        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-model="deliveryProtocol"
              inputId="http"
              name="http"
              value="http"
            />
            <label class="ml-2">HTTP</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="deliveryProtocol"
              inputId="https"
              name="https"
              value="http,https"
            />
            <label class="ml-2">HTTP & HTTPS</label>
          </div>
        </div>

        <label>Port HTTP:</label>
        <Dropdown
          :options="HTTP_PORT_LIST_OPTIONS"
          v-model="httpPort"
          optionLabel="label"
          placeholder="Select a port HTTP"
        />

        <label>Port HTTPS:</label>
        <Dropdown
          :options="HTTPS_PORT_LIST_OPTIONS"
          v-model="httpsPort"
          optionLabel="label"
          placeholder="Select a port HTTPS"
          :disabled="isHttpProtocol"
        />

        <label>Minimum TLS version:</label>
        <Dropdown
          :options="TLS_VERSIONS_OPTIONS"
          v-model="minimumTlsVersion"
          optionLabel="label"
          placeholder="Select a minimum TLS Version"
          :disabled="isHttpProtocol"
        />

        <label>Supported Ciphers list:</label>
        <Dropdown
          :options="SUPPORTED_LIST_OPTIONS"
          v-model="supportedVersion"
          optionLabel="label"
          placeholder="Select a Supported Ciphers list"
          :disabled="isHttpProtocol"
        />

        <Divider />
        <b>Origins</b>

        <label>Origin Type:</label>
        <Dropdown
          :options="ORIGIN_TYPE_LIST_OPTIONS"
          v-model="originType"
          optionLabel="label"
          placeholder="Select a Origin Type"
        />

        <label>Address: *</label>
        <InputText
          id="address"
          v-bind="address"
          :class="{ 'p-invalid': errors.address }"
          v-tooltip.top="{ value: errors.address, showDelay: 200 }"
          aria-describedby="address-help"
        />

        <label>Origin Protocol Policy</label>

        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-model="originProtocolPolicy"
              inputId="preserve"
              name="preserve"
              value="preserve"
            />
            <label class="ml-2">Preserve HTTP/HTTPS protocol</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="originProtocolPolicy"
              inputId="http"
              name="http"
              value="http"
            />
            <label class="ml-2">Enforce HTTP</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="originProtocolPolicy"
              inputId="https"
              name="https"
              value="https"
            />
            <label class="ml-2">Enforce HTTPS</label>
          </div>
        </div>

        <label>Host Header: *</label>
        <InputText
          id="hostHeader"
          v-bind="hostHeader"
          :class="{ 'p-invalid': errors.hostHeader }"
          v-tooltip.top="{ value: errors.hostHeader, showDelay: 200 }"
          aria-describedby="hostHeader-help"
        />

        <Divider />
        <b>Cache Settings</b>

        <label>Browser Cache Settings</label>

        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-model="browserCacheSettings"
              inputId="honor"
              name="honor"
              value="honor"
            />
            <label class="ml-2">Honor Origin Cache Headers</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="browserCacheSettings"
              inputId="override"
              name="override"
              value="override"
            />
            <label class="ml-2">Override Cache Settings</label>
          </div>
        </div>

        <label>Maximum TTL (seconds):</label>
        <InputText
          id="browserCacheSettingsMaximumTtl"
          v-bind="browserCacheSettingsMaximumTtl"
          :class="{ 'p-invalid': errors.browserCacheSettingsMaximumTtl }"
          v-tooltip.top="{ value: errors.browserCacheSettingsMaximumTtl, showDelay: 200 }"
          aria-describedby="browserCacheSettingsMaximumTtl-help"
          :disabled="isCacheTypeHonor"
        />

        <label>CDN Cache Settings</label>
        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-model="cdnCacheSettings"
              inputId="honor"
              name="honor"
              value="honor"
            />
            <label class="ml-2">Honor Origin Cache Settings</label>
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="cdnCacheSettings"
              inputId="override"
              name="override"
              value="override"
            />
            <label class="ml-2">Override Cache Settings</label>
          </div>
        </div>

        <label>Default TTL (seconds):</label>
        <InputText
          id="cdnCacheSettingsMaximumTtl"
          v-bind="cdnCacheSettingsMaximumTtl"
          :class="{ 'p-invalid': errors.cdnCacheSettingsMaximumTtl }"
          v-tooltip.top="{ value: errors.cdnCacheSettingsMaximumTtl, showDelay: 200 }"
          aria-describedby="cdnCacheSettingsMaximumTtl-help"
        />
      </template>
    </CreateFormBlock>
  </div>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import { useForm, useField } from 'vee-validate'
  import { computed } from 'vue'
  import * as yup from 'yup'

  import InputText from 'primevue/inputtext'
  import RadioButton from 'primevue/radiobutton'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'

  const props = defineProps({
    createEdgeApplicationService: {
      type: Function,
      required: true
    }
  })

  const HTTP_PORT_LIST_OPTIONS = [
    { label: '80 (Default)', value: '80' },
    { label: '8008', value: '8008' },
    { label: '8080', value: '8080' }
  ]
  const HTTPS_PORT_LIST_OPTIONS = [
    { label: '443 (Default)', value: '443' },
    { label: '8443', value: '8443' },
    { label: '9440', value: '9440' },
    { label: '9441', value: '9441' },
    { label: '9442', value: '9442' },
    { label: '9443', value: '9443' }
  ]
  const TLS_VERSIONS_OPTIONS = [
    { label: 'None', value: '' },
    { label: 'TLS 1.0', value: 'tls_1_0' },
    { label: 'TLS 1.1', value: 'tls_1_1' },
    { label: 'TLS 1.2', value: 'tls_1_2' },
    { label: 'TLS 1.3', value: 'tls_1_3' }
  ]
  const SUPPORTED_LIST_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'TLSv1.2_2018', value: '2018' },
    { label: 'TLSv1.2_2019', value: '2019' },
    { label: 'TLSv1.2_2021', value: '2021' },
    { label: 'TLSv1.3_2022', value: '2022' }
  ]
  const ORIGIN_TYPE_LIST_OPTIONS = [{ label: 'Single Origin', value: 'single_origin' }]

  const validationSchema = yup.object({
    name: yup.string().required(),
    address: yup.string().required(),
    hostHeader: yup.string().required(),
    cdnCacheSettingsMaximumTtl: yup.string().required()
  })

  const { defineInputBinds, errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      deliveryProtocol: 'http',
      httpPort: { label: '80 (Default)', value: '80' },
      httpsPort: { label: '443 (Default)', value: '443' },
      minimumTlsVersion: { label: 'None', value: '' },
      supportedVersion: { label: 'All', value: 'all' },
      originType: { label: 'Single Origin', value: 'single_origin' },

      address: '',
      originProtocolPolicy: 'preserve',
      hostHeader: '${host}',
      browserCacheSettings: 'honor',
      browserCacheSettingsMaximumTtl: '',
      cdnCacheSettings: 'honor',
      cdnCacheSettingsMaximumTtl: 60
    }
  })

  const { value: deliveryProtocol } = useField('deliveryProtocol')
  const { value: httpPort } = useField('httpPort')
  const { value: httpsPort } = useField('httpsPort')
  const { value: minimumTlsVersion } = useField('minimumTlsVersion')
  const { value: supportedVersion } = useField('supportedVersion')
  const { value: originType } = useField('originType')
  const { value: cdnCacheSettings } = useField('cdnCacheSettings')
  const { value: browserCacheSettings } = useField('browserCacheSettings')
  const { value: originProtocolPolicy } = useField('originProtocolPolicy')

  const name = defineInputBinds('name', { validateOnInput: true })
  const address = defineInputBinds('address', { validateOnInput: true })
  const hostHeader = defineInputBinds('hostHeader', { validateOnInput: true })
  const browserCacheSettingsMaximumTtl = defineInputBinds('browserCacheSettingsMaximumTtl')
  const cdnCacheSettingsMaximumTtl = defineInputBinds('cdnCacheSettingsMaximumTtl', {
    validateOnInput: true
  })

  const isHttpProtocol = computed(() => deliveryProtocol === 'http')
  const isCacheTypeHonor = computed(() => browserCacheSettings === 'honor')
</script>
