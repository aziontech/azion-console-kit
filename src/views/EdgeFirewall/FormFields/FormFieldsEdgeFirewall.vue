<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useField } from 'vee-validate'
  import Card from 'primevue/card'
  import PrimeTag from 'primevue/tag'
  import PickList from 'primevue/picklist'

  defineOptions({ name: 'form-fields-edge-firewall' })

  const props = defineProps({
    domainsService: {
      type: Function,
      required: true
    }
  })

  const DDosProtectionUnmetered = true
  const { value: name, errorMessage: nameError } = useField('name')
  const { value: domains } = useField('domains')
  const { value: active } = useField('isActive')
  const { value: edgeFunctionsEnabled } = useField('edgeFunctionsEnabled')
  const { value: networkProtectionEnabled } = useField('networkProtectionEnabled')
  const { value: wafEnabled } = useField('wafEnabled')

  const listDomains = async () => {
    const domains = await props.domainsService({ pageSize: 1000 })
    return domains
      .filter((item) => !item.edgeFirewallId)
      .map((domain) => ({
        label: domain.name,
        value: domain.id
      }))
  }
</script>

<template>
  <FormHorizontal
    title="General"
    description="Services define dependencies between resources."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ nameError }}
        </small>
        <small class="text-color-secondary text-sm font-normal leading-tight">
          Give a unique and easy-to-remember name.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Domains"
    description="Select the domains that you want to protect with this Rule Set."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-3xl w-full gap-2">
        <PickList
          v-model="domains"
          :pt="{
            sourceList: { class: ['h-80'] },
            targetList: { class: ['h-80'] }
          }"
          dataKey="id"
          breakpoint="1400px"
          :showSourceControls="false"
          :showTargetControls="false"
        >
          <template #sourceheader>Available</template>
          <template #targetheader>Selected</template>
          <template #item="slotProps">
            <div class="flex flex-wrap p-2 align-items-center gap-3">
              <div class="flex-1 flex flex-column gap-2">
                <span class="font-normal">{{ slotProps.item.name }}</span>
              </div>
            </div>
          </template>
        </PickList>
        <small class="text-color-secondary text-sm font-normal leading-tight">
          Hold command or ctrl to select multiple items.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Edge Firewall Modules"
    description="Activate Edge Firewall modules to extend the configuration possibilities of the application. Some modules require subscription."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <div class="flex flex-col gap-3">
          <Card
            :pt="{
              body: { class: 'p-4 border border-orange-500 rounded-md' },
              title: { class: 'flex justify-between items-center text-base font-medium m-0' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">DDoS Protection Unmetered</span>
              <InputSwitch
                v-model="DDosProtectionUnmetered"
                disabled
              />
            </template>
            <template #subtitle>
              Mitigate the largest and most complex network and application-layer DDoS attacks.
            </template>
            <template #footer>
              <PrimeTag
                value="Automatically enabled in all accounts."
                icon="pi pi-lock"
                severity="info"
                class="mt-3"
              />
            </template>
          </Card>
          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  edgeFunctionsEnabled ? 'border-orange-500' : 'border-gray-100'
                }`
              },
              title: { class: 'flex justify-between items-center text-base font-medium m-0' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Edge Functions</span>
              <InputSwitch v-model="edgeFunctionsEnabled" />
            </template>
            <template #subtitle>
              Run security-oriented functions at the edge of the network, closer to your users.
            </template>
          </Card>
          <Card
            :pt="{
              body: {
                class: `p-4 ${
                  networkProtectionEnabled ? 'border border-orange-500 rounded-md' : ''
                }`
              },
              title: { class: 'flex justify-between items-center text-base font-medium m-0' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Network Layer Protection</span>
              <InputSwitch v-model="networkProtectionEnabled" />
            </template>
            <template #subtitle>Description</template>
          </Card>
          <Card
            :pt="{
              body: {
                class: `p-4 ${wafEnabled ? 'border border-orange-500 rounded-md' : ''}`
              },
              title: { class: 'flex justify-between items-center text-base font-medium m-0' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Web Application Firewall</span>
              <InputSwitch v-model="wafEnabled" />
            </template>
            <template #subtitle>Description</template>
          </Card>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
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
    </template>
  </FormHorizontal>
</template>
