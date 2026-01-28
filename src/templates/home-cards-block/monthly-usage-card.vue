<template>
  <HomeCardBlock title="Monthly Usage">
    <template #header-action>
      <div class="flex justify-end">
        <PrimeButton
          v-if="!isLoading"
          icon="pi pi-sliders-v"
          size="small"
          severity="secondary"
          text
          @click="toggleColumnSelector"
        />
        <OverlayPanel
          ref="columnSelectorPanel"
          :pt="{
            root: { class: 'rounded-md ' },
            content: { class: 'p-0 max-w-72 !shadow-none !outline-none rounded-md bg-neutral-900' }
          }"
        >
          <div class="px-3 py-2 bg-neutral-900 rounded-md">
            <span
              class="text-[10px] font-mono uppercase tracking-wider text-[var(--text-color-secondary)] font-medium"
            >
              Show by usage
            </span>
          </div>
          <Listbox
            v-model="selectedOptions"
            :options="allUsageOptions"
            optionLabel="label"
            optionValue="key"
            multiple
            class="w-full border-none"
            listStyle="max-height: 250px"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2 pointer-events-none">
                <Checkbox
                  :modelValue="selectedOptions.includes(option.key)"
                  :binary="true"
                  :tabindex="-1"
                />
                <span class="font-normal">{{ option.label }}</span>
              </div>
            </template>
          </Listbox>
        </OverlayPanel>
      </div>
    </template>
    <template #content>
        <div class="p-4 flex flex-col gap-2.5">
          <template v-if="isLoading">
            <div
              v-for="index in 4"
              :key="index"
              class="flex items-start justify-between text-xs"
            >
              <SkeletonBlock
                width="17rem"
                :isLoaded="false"
              />
              <SkeletonBlock
                width="4rem"
                :isLoaded="false"
              />
            </div>
          </template>
          <template v-else>
            <div
              v-for="item in usageData"
              :key="item.key"
              class="flex items-start justify-between text-xs"
            >
              <span class="text-[var(--text-color-secondary)]">{{ item.label }}</span>
              <span class="text-[var(--text-color)]">{{ item.value }}</span>
            </div>
          </template>
        </div>
    </template>

    <template #footer>
      <span
        class="text-xs text-[var(--text-color-link)] text-center cursor-pointer hover:underline w-full"
        @click="$emit('viewAll')"
      >
        View all Usage...
      </span>
    </template>
  </HomeCardBlock>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import HomeCardBlock from '@/views/Home/components/HomeCard.vue'
  import SkeletonBlock from '@/templates/skeleton-block'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Listbox from 'primevue/listbox'
  import Checkbox from 'primevue/checkbox'
  import {
    listServiceAndProductsChangesService,
    listServiceAndProductsChangesAccountingService,
    loadCurrentInvoiceService
  } from '@/services/billing-services'

  defineOptions({ name: 'MonthlyUsageCard' })

  defineEmits(['viewAll'])

  const DEFAULT_USAGE_LIST = [
    { label: 'No usage data available', value: '---', key: 'no_data' }
  ]

  const DEFAULT_SELECTED_KEYS = [
    'edge_dns_hosted_zones',
    'edge_storage_edge_storage_data_stored',
    'edge_application_requests',
    'edge_application_data_transferred'
  ]

  const accountStore = useAccountStore()
  const { accountIsNotRegular } = storeToRefs(accountStore)

  const allUsageOptions = ref([])
  const selectedOptions = ref([])
  const isLoading = ref(true)
  const columnSelectorPanel = ref(null)

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const usageData = computed(() => {
    if (!selectedOptions.value.length) return DEFAULT_USAGE_LIST
    return allUsageOptions.value.filter((option) =>
      selectedOptions.value.includes(option.key)
    )
  })

  const listServiceAndProductsChanges = async () => {
    isLoading.value = true
    try {
      const currentInvoice = await loadCurrentInvoiceService()
      const billId = currentInvoice?.billId

      if (!billId || billId === '---') {
        allUsageOptions.value = DEFAULT_USAGE_LIST
        return
      }

      const products = accountIsNotRegular.value
        ? await listServiceAndProductsChangesService(billId)
        : await listServiceAndProductsChangesAccountingService(billId)

      if (products?.length) {
        allUsageOptions.value = buildAllUsageOptions(products)
        selectedOptions.value = DEFAULT_SELECTED_KEYS.filter((key) =>
          allUsageOptions.value.some((opt) => opt.key === key)
        )
      } else {
        allUsageOptions.value = DEFAULT_USAGE_LIST
      }
    } catch (error) {
      allUsageOptions.value = DEFAULT_USAGE_LIST
    } finally {
      isLoading.value = false
    }
  }

  const buildAllUsageOptions = (products) => {
    const options = []

    products.forEach((product) => {
      if (!product.descriptions?.length) return

      product.descriptions.forEach((desc) => {
        if (!desc.service) return

        const key = `${product.slug}_${desc.slug}`
        const label = product.service === desc.service ? product.service : `${product.service} ${desc.service}`

        options.push({
          key,
          label,
          value: desc.quantity || '---'
        })
      })
    })

    return options
  }

  onMounted(() => {
    listServiceAndProductsChanges()
  })
</script>

<style scoped>
  :deep(.p-listbox) {
    box-shadow: none !important;
    outline: none !important;
  }

  :deep(.p-listbox:focus) {
    box-shadow: none !important;
    outline: none !important;
  }

  :deep(.p-listbox:focus-visible) {
    box-shadow: none !important;
    outline: none !important;
  }

  :deep(.p-listbox-option.p-focus) {
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
  }

  :deep(.p-listbox-list:focus) {
    box-shadow: none !important;
    outline: none !important;
  }
</style>
