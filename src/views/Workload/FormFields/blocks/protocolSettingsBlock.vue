<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import LabelBlock from '@aziontech/webkit/label'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'

  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import MultiSelect from '@aziontech/webkit/multiselect'
  import { useField } from 'vee-validate'
  import { computed, watch } from 'vue'

  import {
    HTTP_PORT_LIST_OPTIONS,
    HTTPS_PORT_LIST_OPTIONS,
    HTTP3_PORT_LIST_OPTIONS,
    TLS_VERSIONS_OPTIONS,
    SUPPORTED_CIPHERS_LIST_OPTIONS
  } from '@/helpers'

  const { value: protocols } = useField('protocols')
  const { value: tls } = useField('tls')

  useField('tls.ciphers', { initialValue: 'Modern_v2025Q1' })
  useField('tls.minimumVersion', { initialValue: 'tls_1_3' })

  const { errorMessage: httpPortError, value: httpPortValue } = useField('protocols.http.httpPorts')
  const { errorMessage: httpsPortError, value: httpsPortValue } = useField(
    'protocols.http.httpsPorts'
  )

  const { setValue: setUseHttps } = useField('protocols.http.useHttps')
  const { setValue: setUseHttp3 } = useField('protocols.http.useHttp3')

  const { errorMessage: quicPortError, value: quicPortValue } = useField('protocols.http.quicPorts')

  const handleHttps = (value) => {
    if (!value) {
      setUseHttp3(value)
    }
  }

  const handleHttp3 = (value) => {
    if (value) {
      setUseHttps(value)
    }
  }

  const showTlsAndCipherDropdown = computed(
    () => protocols.value?.http?.useHttps || protocols.value?.http?.useHttp3
  )

  const loadInitialTls = {
    ciphers: 7,
    minimumVersion: 'tls_1_3'
  }

  watch(tls, (newTls) => {
    if (!newTls) {
      tls.value = loadInitialTls
    } else {
      loadInitialTls.ciphers = newTls.ciphers
      loadInitialTls.minimumVersion = newTls.minimumVersion
    }
  })
</script>
<template>
  <form-horizontal
    title="Protocol Settings"
    description="Configure the communication protocols used between the Workload and its users. This section allows you to define security, compatibility, and performance settings to optimize how your Workload operates at the edge."
    data-testid="form-horizontal-protocol-settings"
  >
    <template #inputs>
      <div class="flex gap-6 max-sm:flex-col">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-http"
            data-testid="form-horizontal-delivery-settings-http-ports-label"
            label="HTTP Ports"
            isRequired
          />
          <span class="p-input-icon-right">
            <MultiSelect
              :options="HTTP_PORT_LIST_OPTIONS"
              v-model="httpPortValue"
              name="protocols.http.httpPorts"
              filter
              autoFilterFocus
              optionLabel="name"
              :class="{ 'p-invalid': httpPortError }"
              placeholder="Select an HTTP port"
              class="w-full"
              display="chip"
              data-testid="form-horizontal-delivery-settings-http-ports-multi-select"
            />

            <small
              v-if="httpPortError"
              class="p-error text-xs font-normal leading-tight"
              data-testid="form-horizontal-delivery-settings-http-ports-error"
            >
              {{ httpPortError }}
            </small>
          </span>
        </div>
      </div>
      <div class="flex gap-6 max-sm:flex-col">
        <FieldSwitchBlock
          data-testid="domains-form__use-https-field"
          nameField="protocols.http.useHttps"
          name="protocols.http.useHttps"
          auto
          @onSwitchChange="handleHttps"
          :value="protocols?.http?.useHttps"
          :isCard="false"
          title="HTTPS support"
          subtitle="Use both HTTP and HTTPS protocols. Choose from the available HTTP and HTTPS ports."
        />
      </div>
      <div
        class="flex gap-6 flex-col"
        v-if="protocols?.http?.useHttps"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-https"
            data-testid="form-horizontal-delivery-settings-https-ports-label"
            label="HTTPS Ports"
            :isRequired="protocols?.http?.useHttps"
          />
          <span class="p-input-icon-right">
            <MultiSelect
              :options="HTTPS_PORT_LIST_OPTIONS"
              v-model="httpsPortValue"
              name="protocols.http.httpsPorts"
              filter
              autoFilterFocus
              optionLabel="name"
              display="chip"
              :class="{ 'p-invalid': httpsPortError }"
              placeholder="Select an HTTPS port"
              class="w-full"
              data-testid="form-horizontal-delivery-settings-https-ports-multi-select"
            />
            <small
              v-if="httpsPortError"
              class="p-error text-xs font-normal leading-tight"
              data-testid="form-horizontal-delivery-settings-https-ports-error"
            >
              {{ httpsPortError }}
            </small>
          </span>
        </div>
      </div>
      <div
        class="flex gap-6 max-sm:flex-col"
        v-if="showTlsAndCipherDropdown"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            data-testid="form-horizontal-delivery-settings-tls-version-field-dropdown"
            label="Minimum TLS version"
            required
            name="tls.minimumVersion"
            :options="TLS_VERSIONS_OPTIONS"
            optionLabel="label"
            optionValue="value"
            :value="tls?.minimumVersion"
            inputId="tls.minimumVersion"
            placeholder="Select a minimum TLS Version"
            description="Enable HTTP and HTTPS protocols to configure the minimum TLS version the application supports."
          />
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            data-testid="form-horizontal-delivery-settings-cipher-suite-field-dropdown"
            label="Cipher suite"
            name="tls.ciphers"
            :options="SUPPORTED_CIPHERS_LIST_OPTIONS"
            optionLabel="label"
            optionValue="value"
            :value="tls?.ciphers"
            inputId="tls.ciphers"
            placeholder="Select the supported cipher suite"
            description="Select which cipher suite the application supports. See the list of supported ciphers in the documentation."
          />
        </div>
      </div>
      <div class="flex gap-6 max-sm:flex-col">
        <FieldSwitchBlock
          data-testid="domains-form__use-http3-field"
          nameField="protocols.http.useHttp3"
          name="protocols.http.useHttp3"
          auto
          @onSwitchChange="handleHttp3"
          :isCard="false"
          title="HTTP/3 support"
          subtitle="Enable HTTP/3 support. Only available for HTTPS port 443"
        />
      </div>
      <div
        class="flex gap-6 max-sm:flex-col"
        v-if="protocols?.http?.useHttp3"
      >
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            for="port-https"
            data-testid="form-horizontal-delivery-settings-https-port3-label"
            label="HTTP3 Port"
            isRequired
          />
          <span class="p-input-icon-right">
            <i
              class="pi pi-lock text-[var(--text-color-secondary)]"
              data-testid="form-horizontal-delivery-settings-https-ports-lock-icon"
            />
            <MultiSelect
              :options="HTTP3_PORT_LIST_OPTIONS"
              v-model="quicPortValue"
              name="protocols.http.quicPorts"
              filter
              autoFilterFocus
              optionLabel="name"
              display="chip"
              :class="{ 'p-invalid': quicPortError }"
              placeholder="Select an HTTPS port"
              class="w-full"
              disabled
              :pt="{
                trigger: {
                  class: 'hidden'
                }
              }"
              data-testid="form-horizontal-delivery-settings-http3-ports-multi-select"
            />
            <small
              v-if="quicPortError"
              class="p-error text-xs font-normal leading-tight"
              data-testid="form-horizontal-delivery-settings-https-ports-error"
            >
              {{ quicPortError }}
            </small>
          </span>
        </div>
      </div>
    </template>
  </form-horizontal>
</template>
