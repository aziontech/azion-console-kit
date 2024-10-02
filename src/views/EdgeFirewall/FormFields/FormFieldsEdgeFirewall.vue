<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PickList from 'primevue/picklist'
  import Skeleton from 'primevue/skeleton'
  import PrimeTag from 'primevue/tag'
  import { useField } from 'vee-validate'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

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
  const { value: name } = useField('name')
  const { value: domains, resetField } = useField('domains')
  const domainsList = ref([PICK_LIST_SKELETON, PICK_LIST_SKELETON])

  const loading = computed({
    get: () => props.loadingDomains,
    set: (value) => {
      emit('update:loadingDomains', value)
    }
  })

  const classLoading = computed(() => (loading.value ? 'pointer-events-none' : ''))

  const fetchDomains = async () => {
    try {
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
      const availableDomains = notSelectedDomains.filter((element) => !element.edgeFirewallId)
      domainsList.value = [availableDomains, alreadySelectedDomains]
      resetField({
        value: alreadySelectedDomains
      })

      watch(domainsList, (newValue) => {
        domains.value = newValue[1]
      })
    } finally {
      loading.value = false
    }
  }

  const switchOptions = [
    {
      title: 'DDoS Protection Unmetered',
      nameField: 'ddosProtectionUnmetered',
      disabled: true,
      value: true,
      subtitle: 'Mitigate large and complex network, transport, and application-layer DDoS attacks.',
      tag: {
        value: 'Automatically enabled in all accounts',
        icon: 'pi pi-lock'
      }
    },
    {
      title: 'Edge Functions',
      nameField: 'edgeFunctionsEnabled',
      subtitle: 'Build ultra-low latency functions that run on the edge.'
    },
    {
      title: 'Network Layer Protection',
      nameField: 'networkProtectionEnabled',
      subtitle:
        'Create lists to configure a programmable security perimeter for inbound and outbound traffic at the edge.'
    },
    {
      title: 'Web Application Firewall',
      nameField: 'wafEnabled',
      subtitle: 'Protect edge applications against threats and attacks.'
    }
  ]
  onMounted(async () => {
    await fetchDomains()
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create an edge firewall to configure security logics and protect servers and applications."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          data-testid="edge-firewall-form__name-field"
          :value="name"
          placeholder="My edge firewall"
          description="Give a unique and descriptive name to identify the edge firewall."
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Domains"
    description="Define the addresses to which the edge firewall should apply rules by associating registered domains."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-3xl w-full gap-2">
        <PickList
          v-model="domainsList"
          :pt="{
            sourceList: { class: [`h-80 ${classLoading}`] },
            targetList: { class: [`h-80 ${classLoading}`] },
            buttons: { class: classLoading },
            sourceWrapper: { class: 'max-w-[340px]' },
            targetWrapper: { class: 'max-w-[340px]' }
          }"
          :showSourceControls="false"
          :showTargetControls="false"
          :move-all-to-source-props="{
            'data-testid': 'edge-firewall-form__domain-picklist__move-all-to-source-btn'
          }"
          :move-all-to-target-props="{
            'data-testid': 'edge-firewall-form__domain-picklist__move-all-to-target-btn'
          }"
          :move-to-target-props="{
            'data-testid': 'edge-firewall-form__domain-picklist__move-to-target-btn'
          }"
          :move-to-source-props="{
            'data-testid': 'edge-firewall-form__domain-picklist__move-to-source-btn'
          }"
        >
          <template #sourceheader>Available</template>
          <template #targetheader>Selected</template>
          <template #item="slotProps">
            <div
              class="flex flex-wrap p-2 pl-0 align-items-center gap-3 max-w-xs"
              v-if="!loading"
            >
              <div class="flex-1 flex flex-column gap-2 overflow-hidden pr-2">
                <span
                  class="font-normal truncate"
                  v-tooltip.top="slotProps.item.name"
                  >{{ slotProps.item.name }}</span
                >
              </div>
            </div>
            <Skeleton
              v-else
              height="2.2rem"
              class="mb-2 z-0"
            />
          </template>
        </PickList>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select an item from the list and then use the arrows to move it between the available and
          selected domains boxes. Use the double-line arrows to move all items or press the
          <code>ctrl</code> or <code>command</code> keys to select multiple items.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Modules"
    description="Activate modules to extend configuration possibilities. Some modules require subscription."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldGroupSwitch
          isCard
          :options="switchOptions"
        >
          <template #footer="{ item }">
            <PrimeTag
              v-if="item?.tag"
              :value="item.tag.value"
              :icon="item.tag.icon"
              severity="info"
              class="mt-3"
            />
          </template>
        </FieldGroupSwitch>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Debug Rules"
    description="Log executed rules created in Rules Engine. Query logs using Data Stream, Real-Time Events, or Real-Time Events GraphQL API."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="debugRules"
          name="debugRules"
          auto
          :isCard="false"
          title="Active"
          subtitle="Rules that were successfully executed will be shown under the $traceback field in Data Streaming and Real-Time Events or the $stacktrace variable in GraphQL."
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="isActive"
          name="isActive"
          auto
          :isCard="false"
          title="Active"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
