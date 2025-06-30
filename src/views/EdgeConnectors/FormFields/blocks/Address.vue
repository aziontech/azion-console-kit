<template>
  <FormHorizontal
    title="Address Management"
    description="Add addresses to your Edge Connector. By default, it supports a single origin address. If the Load Balancer module is enabled, you can manage up to 15 addresses for advanced traffic distribution."
    data-testid="edge-connectors-form__section__address-management"
  >
    <template #inputs>
      <Accordion
        :activeIndex="0"
        v-if="loadBalancerEnabled"
      >
        <AccordionTab>
          <template #header>
            <div class="flex flex-row items-center justify-between w-full">
              <div>
                <div class="flex flex-row items-center gap-3">
                  <p>example.com</p>
                  <Tag
                    value="Desactived"
                    severity="danger"
                  />
                </div>
                <div class="flex gap-2">
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Plain Port:</p>
                    <p class="text-sm font-medium text-color">80</p>
                  </div>
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">TLS Port:</p>
                    <p class="text-sm font-medium text-color">443</p>
                  </div>
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Server Role:</p>
                    <p class="text-sm font-medium text-color">Primary</p>
                  </div>
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Weight:</p>
                    <p class="text-sm font-medium text-color">1</p>
                  </div>
                </div>
              </div>
              <PrimeButton
                icon="pi pi-trash"
                severity="primary"
                outlined
              />
            </div>
          </template>
          <div class="flex flex-col w-full gap-5">
            <div class="flex flex-col sm:max-w-sm w-full gap-2">
              <FieldText
                label="Address"
                required
                description="IPv4/IPv6 address or CNAME to resolve (e.g., 'example.com' or '192.168.0.1')."
                name="address"
                :value="address"
                placeholder="example.com"
                data-testid="edge-connectors-form__address-management__address-field"
              />
            </div>

            <div class="flex sm:flex-row flex-col gap-5">
              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="Plain Port"
                  name="plainPort"
                  :value="plainPort"
                  description="Specify the plain (non-encrypted) port for communication with the origin (e.g., 80 for HTTP)."
                  data-testid="edge-connectors-form__address-management__plain-port-field"
                />
              </div>

              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="TLS Port"
                  name="tlsPort"
                  :value="tlsPort"
                  description="Specify the secure port for encrypted communication with the origin (e.g., 443 for HTTPS)."
                  data-testid="edge-connectors-form__address-management__tls-port-field"
                />
              </div>
            </div>

            <Divider
              align="left"
              type="solid"
            >
              <b>Load Balancer Settings</b>
            </Divider>

            <div class="flex flex-col sm:max-w-sm w-full gap-2">
              <FieldDropdown
                label="Server Role"
                name="serverRole"
                :options="serverRoleList"
                optionLabel="label"
                optionValue="value"
                :value="serverRole"
                appendTo="self"
                description="Define the role of the server in the load balancing setup."
                data-testid="edge-connectors-form__address-management__server-role-field"
              />
            </div>

            <div class="flex sm:flex-row flex-col gap-5">
              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="Max Conns"
                  name="maxConns"
                  :value="maxConns"
                  description="Maximum number of open connections per ..."
                  data-testid="edge-connectors-form__address-management__max-conns-field"
                />
              </div>

              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="Weight"
                  name="weight"
                  :value="weight"
                  description="Higher weights allocate more traffic to this address."
                  data-testid="edge-connectors-form__address-management__weight-field"
                />
              </div>
            </div>

            <Divider
              align="left"
              type="solid"
            >
              <b>Health Checks</b>
            </Divider>

            <div class="flex sm:flex-row flex-col gap-5">
              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="Max Fails"
                  name="maxFails"
                  :value="maxFails"
                  description="Maximum number of communication attempts before marking as unavailable"
                  data-testid="edge-connectors-form__address-management__max-fails-field"
                />
              </div>

              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="Fail Timeout"
                  name="failTimeout"
                  :value="failTimeout"
                  description="Timeout for communication attempts"
                  data-testid="edge-connectors-form__address-management__fail-timeout-field"
                />
              </div>
            </div>

            <div class="flex flex-col sm:max-w-sm w-full gap-2">
              <FieldSwitchBlock
                nameField="active"
                name="active"
                auto
                :isCard="false"
                :value="active"
                title="Active"
                data-testid="edge-connectors-form__address-management__active-field"
              />
            </div>
          </div>
        </AccordionTab>
      </Accordion>

      <Card>
        <template #content>
          <div class="p-5 flex flex-col gap-5">
            <div class="flex flex-col sm:max-w-sm w-full gap-2">
              <FieldText
                label="Address"
                required
                description="IPv4/IPv6 address or CNAME to resolve."
                name="address"
                :value="address"
                placeholder=""
                data-testid="edge-connectors-form__address-management__address-field"
              />
            </div>

            <div class="flex sm:flex-row flex-col gap-5">
              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="Plain Port"
                  name="plainPort"
                  :value="plainPort"
                  description=""
                  data-testid="edge-connectors-form__address-management__plain-port-field"
                />
              </div>

              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="TLS Port"
                  name="tlsPort"
                  :value="tlsPort"
                  description=""
                  data-testid="edge-connectors-form__address-management__tls-port-field"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <div class="flex sm:flex-row flex-col sm:items-center items-start w-full gap-3">
        <PrimeButton
          label="Add Address"
          severity="primary"
          icon="pi pi-plus-circle"
          size="small"
          outlined
          :disabled="!loadBalancerEnabled"
        />

        <div
          class="flex items-center gap-2"
          v-if="!loadBalancerEnabled"
        >
          <i class="pi pi-lock text-color-secondary"></i>
          <p class="text-xs font-normal text-color-secondary">
            You can add more address enabling Load Balancer module above.
          </p>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import PrimeButton from 'primevue/button'
  import Tag from 'primevue/tag'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import { useField } from 'vee-validate'
  import Divider from 'primevue/divider'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock.vue'
  import Card from 'primevue/card'

  defineOptions({ name: 'EdgeConnectorsFormFieldsAddress' })

  const { value: address } = useField('address')
  const { value: plainPort } = useField('plainPort')
  const { value: tlsPort } = useField('tlsPort')
  const { value: serverRole } = useField('serverRole')
  const { value: maxConns } = useField('maxConns')
  const { value: weight } = useField('weight')
  const { value: maxFails } = useField('maxFails')
  const { value: failTimeout } = useField('failTimeout')
  const { value: active } = useField('active')

  const serverRoleList = [
    { label: 'Primary', value: 'primary' },
    { label: 'Backup', value: 'backup' }
  ]

  const loadBalancerEnabled = false
</script>
