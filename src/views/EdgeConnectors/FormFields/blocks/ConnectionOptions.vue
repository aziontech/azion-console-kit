<template>
  <FormHorizontal
    title="Connection Options"
    description="Configure the connection options for your edge connector."
    data-testid="edge-connectors-form__section__connection-options"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldText
          label="Host"
          required
          description="Enter the domain or IP address of the origin server (e.g., 'example.com' or '192.168.0.1')."
          name="host"
          :value="host"
          placeholder="example.com"
          data-testid="edge-connectors-form__connection-options__host-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldInputGroup
          label="Path"
          description="Specify the path to the resource on the origin server (e.g., '/api/v1/resource'). Use '/' for the root path."
          name="path"
          :value="path"
          placeholder="api/v1/resource"
          data-testid="edge-connectors-form__connection-options__path-field"
        >
          <template #icon> / </template>
        </FieldInputGroup>
      </div>

      <div class="flex sm:flex-row flex-col w-full gap-8">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Real Ip Header"
            required
            description="Provide the header name that contains the client's real IP address (e.g., 'X-Real-IP')."
            name="realIpHeader"
            :value="realIpHeader"
            placeholder="X-Real-IP"
            data-testid="edge-connectors-form__connection-options__real-ip-header-field"
          />
        </div>
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Real Port Header"
            required
            description="Provide the header name that contains the client's real port (e.g., 'X-Real-PORT)."
            name="realPortHeader"
            :value="realPortHeader"
            placeholder="X-Real-PORT"
            data-testid="edge-connectors-form__connection-options__real-port-header-field"
          />
        </div>
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldSwitchBlock
          nameField="followingRedirect"
          name="followingRedirect"
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
          required
          name="dnsResolution"
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
          required
          name="transportPolicy"
          :options="transportPolicyList"
          optionLabel="label"
          optionValue="value"
          :value="transportPolicy"
          appendTo="self"
          description="Specify the transport protocol behavior for the connection."
          data-testid="edge-connectors-form__connection-options__transport-policy-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'

  defineOptions({ name: 'EdgeConnectorsFormFieldsConnectionOptions' })

  const { value: host } = useField('host')
  const { value: path } = useField('path')
  const { value: realIpHeader } = useField('realIpHeader')
  const { value: realPortHeader } = useField('realPortHeader')
  const { value: followingRedirect } = useField('followingRedirect')
  const { value: dnsResolution } = useField('dnsResolution')
  const { value: transportPolicy } = useField('transportPolicy')

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
</script>
