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
          <div class="px-3 py-2 bg-neutral-900 rounded-md flex items-center justify-between">
            <span
              class="text-[10px] font-mono uppercase tracking-wider var(--text-color-secondary) font-medium"
            >
              Show by usage
            </span>
            <i
              v-if="hasReachedMaxSelections"
              v-tooltip.left="{
                value: 'You\'ve reached the maximum selection (6 items).',
                showDelay: 200
              }"
              class="pi pi-exclamation-triangle flex justify-center items-center text-yellow-500 cursor-help w-4 h-4 text-base"
            />
          </div>
          <Listbox
            :modelValue="selectedOptions"
            :options="allUsageOptions"
            optionLabel="label"
            optionValue="key"
            multiple
            class="w-full border-none"
            listStyle="max-height: 250px"
            @update:modelValue="handleSelectionChange"
          >
            <template #option="{ option }">
              <div
                class="flex items-center gap-2"
                :class="{
                  'pointer-events-none': true,
                  'opacity-50 cursor-not-allowed': isOptionDisabled(option.key)
                }"
              >
                <Checkbox
                  :modelValue="selectedOptions.includes(option.key)"
                  :binary="true"
                  :tabindex="-1"
                  :disabled="isOptionDisabled(option.key)"
                />
                <span class="font-normal text-xs py-2">{{ option.label }}</span>
              </div>
            </template>
          </Listbox>
        </OverlayPanel>
      </div>
    </template>
    <template #content>
      <div class="p-4 flex flex-col gap-2.5 bg-[var(--card-content-bg)]">
        <template v-if="isLoading">
          <div
            v-for="index in 4"
            :key="index"
            class="flex items-start justify-between gap-2 text-xs"
          >
            <SkeletonBlock
              width="17rem"
              height="1rem"
              :isLoaded="false"
            />
            <SkeletonBlock
              width="4rem"
              height="1rem"
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
            <span class="text-color-secondary text-left">{{ item.label }}</span>
            <span class="text-color text-right">{{ item.value }}</span>
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
  import PrimeButton from '@aziontech/webkit/button'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import Listbox from '@aziontech/webkit/listbox'
  import Checkbox from '@aziontech/webkit/checkbox'
  import {
    listServiceAndProductsChangesService,
    listServiceAndProductsChangesAccountingService,
    loadCurrentInvoiceService
  } from '@/services/billing-services'

  defineOptions({ name: 'MonthlyUsageCard' })

  defineEmits(['viewAll'])

  const DEFAULT_USAGE_LIST = [{ label: 'No usage data available', value: '---', key: 'no_data' }]

  const DEFAULT_SELECTED_KEY_GROUPS = [
    ['edge_dns_hosted_zones', 'edge_dns_edge_dns_zones'],
    ['edge_storage_edge_storage_data_stored', 'object_storage_edge_storage_data_stored'],
    ['edge_application_requests', 'application_application_requests'],
    ['edge_application_data_transferred', 'application_data_transferred']
  ]

  const accountStore = useAccountStore()
  const { accountIsNotRegular } = storeToRefs(accountStore)

  const allUsageOptions = ref([])
  const selectedOptions = ref([])
  const isLoading = ref(true)
  const columnSelectorPanel = ref(null)

  const MAX_SELECTIONS = 6
  const LOCAL_STORAGE_KEY = 'monthly_usage_selected_keys'

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const hasReachedMaxSelections = computed(() => {
    return selectedOptions.value.length >= MAX_SELECTIONS
  })

  const isOptionDisabled = (optionKey) => {
    return hasReachedMaxSelections.value && !selectedOptions.value.includes(optionKey)
  }

  const handleSelectionChange = (newSelection) => {
    if (newSelection.length <= MAX_SELECTIONS) {
      selectedOptions.value = newSelection
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSelection))
    }
  }

  const usageData = computed(() => {
    if (!selectedOptions.value.length) return DEFAULT_USAGE_LIST
    return allUsageOptions.value.filter((option) => selectedOptions.value.includes(option.key))
  })

  const buildDefaultSelection = (availableOptionKeys) => {
    const defaultKeys = DEFAULT_SELECTED_KEY_GROUPS.map((group) =>
      group.find((key) => availableOptionKeys.includes(key))
    ).filter(Boolean)

    return [...new Set(defaultKeys)].slice(0, MAX_SELECTIONS)
  }

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

        let storedKeys = null
        let hasStoredConfig = false
        try {
          const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
          hasStoredConfig = storedData !== null
          if (hasStoredConfig) storedKeys = JSON.parse(storedData)
        } catch {
          //eslint-disable-next-line no-console
          console.warn('[MonthlyUsageCard] No keys found in localstorage')
        }

        const availableOptionKeys = allUsageOptions.value.map((opt) => opt.key)
        const defaultSelection = buildDefaultSelection(availableOptionKeys)
        const fallbackSelection =
          defaultSelection.length > 0
            ? defaultSelection
            : availableOptionKeys.slice(0, MAX_SELECTIONS)

        if (hasStoredConfig && Array.isArray(storedKeys)) {
          const validStoredSelection = storedKeys
            .filter((key) => availableOptionKeys.includes(key))
            .slice(0, MAX_SELECTIONS)

          selectedOptions.value =
            storedKeys.length === 0
              ? []
              : validStoredSelection.length > 0
                ? validStoredSelection
                : fallbackSelection
        } else {
          selectedOptions.value = fallbackSelection
        }
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
        const isIncluded = desc.service.toLowerCase().includes(product.service.toLowerCase())
        const label = isIncluded ? desc.service : `${product.service} ${desc.service}`

        options.push({
          key,
          label,
          value: desc.quantity ?? '---'
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
    border: none !important;
    border-color: transparent !important;
  }

  :deep(.p-listbox.p-component.p-focus) {
    box-shadow: none !important;
    outline: none !important;
    border: none !important;
    border-color: transparent !important;
  }

  :deep(.p-listbox:focus) {
    box-shadow: none !important;
    outline: none !important;
  }

  :deep(.p-listbox:focus-visible) {
    box-shadow: none !important;
    outline: none !important;
  }

  :deep(.p-listbox-item.p-focus) {
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
  }

  :deep(.p-listbox-item.p-highlight) {
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }

  :deep(.p-listbox-item:focus) {
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
  }

  :deep(.p-listbox-list:focus) {
    box-shadow: none !important;
    outline: none !important;
  }
</style>
