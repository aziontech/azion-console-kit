<template>
  <FormHorizontal
    title="Address Management"
    description="Add addresses to your Edge Connector. By default, it supports a single origin address. If the Load Balancer module is enabled, you can manage up to 15 addresses for advanced traffic distribution."
    data-testid="edge-connectors-form__section__address-management"
  >
    <template #inputs>
      <div v-show="isLoadBalancerEnabled">
        <Accordion v-model:activeIndex="activeAccordions">
          <AccordionTab
            v-for="(_, addressIndex) in addresses"
            :key="addressIndex"
          >
            <template #header>
              <div class="flex flex-row items-center justify-between w-full">
                <div>
                  <div class="flex flex-row items-center gap-2">
                    <p class="break-all whitespace-normal">
                      {{ addresses[addressIndex].value.address || 'example.com' }}
                    </p>
                    <Tag
                      value="Desactived"
                      severity="danger"
                      v-if="!addresses[addressIndex].value.active"
                      :pt="{
                        root: '!px-1.5 !py-0.5'
                      }"
                    />
                  </div>
                  <div class="flex gap-2">
                    <div class="flex gap-1">
                      <p class="text-sm font-normal text-color-secondary">HTTP Port:</p>
                      <p class="text-sm font-medium text-color">
                        {{ addresses[addressIndex].value.httpPort }}
                      </p>
                    </div>
                    <div class="flex gap-1">
                      <p class="text-sm font-normal text-color-secondary">HTTPS Port:</p>
                      <p class="text-sm font-medium text-color">
                        {{ addresses[addressIndex].value.httpsPort }}
                      </p>
                    </div>
                    <div class="flex gap-1">
                      <p class="text-sm font-normal text-color-secondary">Server Role:</p>
                      <p class="text-sm font-medium text-color">
                        {{ addresses[addressIndex].value.serverRole }}
                      </p>
                    </div>
                    <div class="flex gap-1">
                      <p class="text-sm font-normal text-color-secondary">Weight:</p>
                      <p class="text-sm font-medium text-color">
                        {{ addresses[addressIndex].value.weight }}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <PrimeButton
                    icon="pi pi-trash"
                    severity="primary"
                    outlined
                    :disabled="addresses.length === 1"
                    @click="removeAddressByIndex(addressIndex)"
                    :data-testid="`edge-connectors-form__address-management__remove-button[${addressIndex}]`"
                  />
                </div>
              </div>
            </template>
            <div class="flex flex-col w-full gap-5">
              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldText
                  label="Address"
                  required
                  description="IPv4/IPv6 address or CNAME to resolve (e.g., 'example.com' or '192.168.0.1')."
                  :name="`addresses[${addressIndex}].address`"
                  :value="addresses[addressIndex].value.address"
                  placeholder="example.com"
                  data-testid="edge-connectors-form__address-management__address-field"
                />
              </div>

              <div class="flex sm:flex-row flex-col gap-5">
                <div class="flex flex-col sm:max-w-sm w-full gap-2">
                  <FieldNumber
                    label="HTTP Port"
                    :name="`addresses[${addressIndex}].httpPort`"
                    :value="addresses[addressIndex].value.httpPort"
                    :min="1"
                    :max="65535"
                    description="Specify the plain (non-encrypted) port for communication with the origin (e.g., 80 for HTTP)."
                    data-testid="edge-connectors-form__address-management__http-port-field"
                  />
                </div>

                <div class="flex flex-col sm:max-w-sm w-full gap-2">
                  <FieldNumber
                    label="HTTPS Port"
                    :name="`addresses[${addressIndex}].httpsPort`"
                    :value="addresses[addressIndex].value.httpsPort"
                    :min="1"
                    :max="65535"
                    description="Specify the secure port for encrypted communication with the origin (e.g., 443 for HTTPS)."
                    data-testid="edge-connectors-form__address-management__https-port-field"
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
                  :name="`addresses[${addressIndex}].serverRole`"
                  :options="serverRoleList"
                  optionLabel="label"
                  optionValue="value"
                  :value="addresses[addressIndex].value.serverRole"
                  appendTo="self"
                  description="Define the role of the server in the load balancing setup."
                  data-testid="edge-connectors-form__address-management__server-role-field"
                />
              </div>

              <div class="flex sm:flex-row flex-col gap-5">
                <div class="flex flex-col sm:max-w-sm w-full gap-2">
                  <FieldNumber
                    label="Weight"
                    :min="1"
                    :max="100"
                    :name="`addresses[${addressIndex}].weight`"
                    :value="addresses[addressIndex].value.weight"
                    description="Higher weights allocate more traffic to this address."
                    data-testid="edge-connectors-form__address-management__weight-field"
                  />
                </div>
              </div>

              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldSwitchBlock
                  :nameField="`addresses[${addressIndex}].active`"
                  :name="`addresses[${addressIndex}].active`"
                  auto
                  :isCard="false"
                  :value="addresses[addressIndex].value.active"
                  title="Active"
                  data-testid="edge-connectors-form__address-management__active-field"
                />
              </div>
            </div>
          </AccordionTab>
        </Accordion>
      </div>

      <Card v-if="!isLoadBalancerEnabled">
        <template #content>
          <div class="p-5 flex flex-col gap-5">
            <div class="flex flex-col sm:max-w-sm w-full gap-2">
              <FieldText
                label="Address"
                required
                description="IPv4/IPv6 address or CNAME to resolve."
                :name="`addresses[${0}].address`"
                :value="addresses[0]?.value?.address"
                placeholder=""
                data-testid="edge-connectors-form__address-management__address-field"
              />
            </div>

            <div class="flex sm:flex-row flex-col gap-5">
              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="HTTP Port"
                  :name="`addresses[${0}].httpPort`"
                  :value="addresses[0]?.value?.httpPort"
                  :min="0"
                  description=""
                  data-testid="edge-connectors-form__address-management__http-port-field"
                />
              </div>

              <div class="flex flex-col sm:max-w-sm w-full gap-2">
                <FieldNumber
                  label="HTTPS Port"
                  :name="`addresses[${0}].httpsPort`"
                  :value="addresses[0]?.value?.httpsPort"
                  :min="0"
                  description=""
                  data-testid="edge-connectors-form__address-management__https-port-field"
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
          :disabled="disableAddButton"
          @click="addNewAddress('click')"
        />

        <div
          class="flex items-center gap-2"
          v-if="!isLoadBalancerEnabled"
        >
          <i class="pi pi-lock text-color-secondary"></i>
          <p class="text-xs font-normal text-color-secondary">
            You can add more addresses enabling Load Balancer module above.
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
  import { useField, useFieldArray } from 'vee-validate'
  import Divider from 'primevue/divider'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock.vue'
  import Card from 'primevue/card'
  import { computed, watch, ref } from 'vue'

  defineOptions({ name: 'EdgeConnectorsFormFieldsAddress' })

  const { fields: addresses, push: pushAddress, remove: removeAddress } = useFieldArray('addresses')

  const { value: loadBalancer } = useField('modules.loadBalancer.enabled')

  const activeAccordions = ref(0)
  const maximumAddressQuantity = 15

  const serverRoleList = [
    { label: 'Primary', value: 'primary' },
    { label: 'Backup', value: 'backup' }
  ]

  const DEFAULT_ADDRESS = {
    address: '',
    httpPort: 80,
    httpsPort: 443,
    serverRole: 'primary',
    weight: 1,
    active: true
  }

  const isLoadBalancerEnabled = computed(() => {
    return loadBalancer.value
  })

  const addNewAddress = () => {
    if (addresses.value.length < maximumAddressQuantity) {
      pushAddress(DEFAULT_ADDRESS)
      const index = addresses.value.length - 1
      activeAccordions.value = index
    }
  }

  const removeAddressByIndex = (index) => {
    if (addresses.value.length === 1) return
    removeAddress(index)
  }

  const disableAddButton = computed(() => {
    return addresses.value.length === maximumAddressQuantity || !isLoadBalancerEnabled.value
  })

  watch(loadBalancer, (newValue) => {
    if (newValue) {
      if (addresses.value.length === 0) {
        addNewAddress()
      }
    } else {
      if (addresses.value.length > 1) {
        // eslint-disable-next-line id-length
        addresses.value.forEach((_, index) => {
          if (index === 0) return
          removeAddressByIndex(index)
        })
      }
    }
  })
</script>
