<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Card from 'primevue/card'
  import InputSwitch from 'primevue/inputswitch'
  import PickList from 'primevue/picklist'
  import Skeleton from 'primevue/skeleton'
  import PrimeTag from 'primevue/tag'
  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'

  defineOptions({ name: 'form-fields-edge-firewall' })
  const emit = defineEmits(['update:loadingDomains'])

  const props = defineProps({
    domainsService: {
      type: Function,
      required: true
    },
    loadingDomains: {
      type: Boolean,
      default: false
    }
  })

  const PICK_LIST_SKELETON = Array.from({ length: 7 }, () => ({}))

  const DDosProtectionUnmetered = true

  const { value: name } = useField('name')
  const { value: domains, resetField } = useField('domains')
  const { value: isActive } = useField('isActive')
  const { value: debugRules } = useField('debugRules')

  const { value: edgeFunctionsEnabled } = useField('edgeFunctionsEnabled')
  const { value: networkProtectionEnabled } = useField('networkProtectionEnabled')
  const { value: wafEnabled } = useField('wafEnabled')
  const domainsList = ref([PICK_LIST_SKELETON, PICK_LIST_SKELETON])

  const loading = computed({
    get: () => props.loadingDomains,
    set: (value) => {
      emit('update:loadingDomains', value)
    }
  })

  const classLoading = computed(() => (loading.value ? 'pointer-events-none' : ''))

  const fetchDomains = async () => {
    loading.value = true
    const responseDomains = await props.domainsService({ pageSize: 1000 })
    const alreadySelectedDomainsIds = domains.value?.map((domain) => domain) || []

    const alreadySelectedDomains =
      responseDomains.filter((domain) => alreadySelectedDomainsIds.includes(domain.id)) || []

    const notSelectedDomains =
      responseDomains.filter((domain) => {
        if (!domain.edgeFirewallId && !alreadySelectedDomainsIds.includes(domain.id)) {
          return domain
        }
      }) || []

    domainsList.value = [notSelectedDomains, alreadySelectedDomains]
    loading.value = false

    resetField({
      value: alreadySelectedDomains
    })

    watch(domainsList, (newValue) => {
      domains.value = newValue[1]
    })
  }

  onMounted(async () => {
    await fetchDomains()
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Services define dependencies between resources."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          :value="name"
          description="Give a unique and easy-to-remember name."
        />
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
          v-model="domainsList"
          :pt="{
            sourceList: { class: [`h-80 ${classLoading}`] },
            targetList: { class: [`h-80 ${classLoading}`] },
            buttons: { class: classLoading }
          }"
          :showSourceControls="false"
          :showTargetControls="false"
        >
          <template #sourceheader>Available</template>
          <template #targetheader>Selected</template>
          <template #item="slotProps">
            <div
              class="flex flex-wrap p-2 align-items-center gap-3"
              v-if="!loading"
            >
              <div class="flex-1 flex flex-column gap-2">
                <span class="font-normal">{{ slotProps.item.name }}</span>
              </div>
            </div>
            <Skeleton
              v-else
              height="2.2rem"
              class="mb-2 z-0"
            />
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
        <label class="text-color text-base font-medium">Modules *</label>
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
                  edgeFunctionsEnabled ? 'border-orange-500' : 'border-transparent'
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
                class: `p-4 border rounded-md ${
                  networkProtectionEnabled ? 'border-orange-500' : 'border-transparent'
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
                class: `p-4 border rounded-md ${
                  wafEnabled ? 'border-orange-500' : 'border-transparent'
                }`
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
  <FormHorizontal
    title="Debug Rules"
    description="Create a log of executed rules. Logs can be accessed through Data Streaming, Real-Time Events or Real-Time Events GraphQL API."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <Card
          :pt="{
            root: { class: 'shadow-none  rounded-none' },
            body: { class: 'py-4 border-0' },
            content: { class: 'ml-12' },
            title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
            subtitle: {
              class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
            }
          }"
        >
          <template #title>
            <InputSwitch
              v-model="debugRules"
              inputId="active"
            />
            <div class="flex-col gap-1">
              <label
                for="active"
                class="text-color text-sm font-normal"
                >Active</label
              >
            </div>
          </template>
          <template #content>
            <small class="text-color-secondary text-sm">
              Rules that were successfully executed will be shown under the $traceback field in Data
              Streaming and Real-Time Events or the $stacktrace variable in GraphQL.
            </small>
          </template>
        </Card>
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
              v-model="isActive"
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
