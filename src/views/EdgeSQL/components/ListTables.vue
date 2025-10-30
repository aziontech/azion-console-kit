<template>
  <div class="sm:w-64 w-full">
    <div
      class="flex justify-between items-center w-64"
      v-if="!showCheckbox"
    >
      <h3 class="text-lg font-normal text-color-primary">Tables</h3>

      <div class="flex gap-2">
        <PrimeButton
          icon="pi pi-refresh"
          size="small"
          outlined
          @click="$emit('reload-tables')"
          data-testid="reload-table-button"
          class="w-8 h-8 p-0 flex items-center justify-center"
        />
        <PrimeButton
          icon="pi pi-plus"
          size="small"
          outlined
          @click="$emit('create-table')"
          data-testid="create-table-button"
          class="w-8 h-8 p-0 flex items-center justify-center"
        />
      </div>
    </div>
    <div
      class="flex justify-between items-center w-64"
      v-else
    >
      <div class="flex gap-2 items-center">
        <PrimeButton
          icon="pi pi-times"
          size="small"
          outlined
          v-tooltip.top="{ value: 'Cancel' }"
          @click="closeCheckbox"
          data-testid="cancel-table-button"
          class="w-8 h-8 p-0 flex items-center justify-center"
        />
        <span class="text-color-secondary">{{ selectedTables.length }} itens selected</span>
      </div>
      <div class="flex gap-2">
        <PrimeButton
          icon="ai ai-scizors"
          size="small"
          outlined
          v-tooltip.top="{ value: 'Truncate' }"
          @click="$emit('open-confirm-truncate')"
          data-testid="truncate-table-button"
          class="w-8 h-8 p-0 flex items-center justify-center"
        />
        <PrimeButton
          icon="pi pi-trash"
          size="small"
          v-tooltip.top="{ value: 'Delete' }"
          @click="$emit('open-confirm-delete')"
          severity="danger"
          data-testid="delete-table-button"
          class="w-8 h-8 p-0 flex items-center justify-center"
        />
      </div>
    </div>

    <div class="p-input-icon-left w-full mt-4">
      <i class="pi pi-search" />
      <InputText
        v-model="searchTerm"
        placeholder="Search tables"
        class="w-full"
      />
    </div>

    <div class="flex-1 overflow-y-auto max-h-[calc(100svh-40%)]">
      <div
        v-if="isLoading"
        class="flex flex-col gap-3"
      >
        <div
          v-for="index in 3"
          :key="index"
          class="py-2 rounded"
        >
          <div class="flex items-center justify-between">
            <Skeleton class="h-8 w-full" />
          </div>
        </div>
      </div>
      <div
        v-else-if="!filteredTables.length"
        class="text-left py-2"
      >
        <div class="text-color-secondary text-sm">
          {{ searchTerm ? 'No tables found.' : 'No tables created yet.' }}
        </div>
      </div>
      <div
        v-else
        class="mt-4"
      >
        <div
          v-for="table in filteredTables"
          :key="table.id || table.name"
          class="group p-2 rounded cursor-pointer hover:bg-[--table-bg-color] transition-colors"
          @click="$emit('select-table', table)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center group">
                <i
                  class="ai ai-datasheet group-hover:hidden"
                  @click.stop="showCheckboxAndSelectTable(table)"
                  v-show="!showCheckbox"
                />
                <Checkbox
                  v-model="localSelectedTables"
                  :value="table.name"
                  :class="showCheckbox ? 'inline-flex' : 'hidden group-hover:inline-flex'"
                />
              </span>
              <span class="text-sm font-medium text-color-primary truncate">{{ table.name }}</span>
            </div>

            <PrimeButton
              icon="pi pi-ellipsis-h"
              size="small"
              outlined
              @click.stop="$emit('show-table-menu', $event, table)"
              data-testid="table-menu-button"
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import PrimeButton from 'primevue/button'
  import Checkbox from 'primevue/checkbox'

  const emit = defineEmits([
    'update:selectedTables',
    'update:showCheckbox',
    'reload-tables',
    'create-table',
    'select-table',
    'show-table-menu',
    'open-confirm-truncate',
    'open-confirm-delete'
  ])

  const props = defineProps({
    listTables: { type: Array, required: true },
    isLoading: { type: Boolean, default: false },
    selectedTables: { type: Array, default: () => [] },
    showCheckbox: { type: Boolean, default: false }
  })

  const searchTerm = ref('')

  const filteredTables = computed(() => {
    const list = Array.isArray(props.listTables) ? props.listTables : []
    const term = (searchTerm.value || '').toString().toLowerCase()
    if (!term) return list
    return list.filter((table) => {
      const raw = table?.name ?? ''
      const label = raw != null ? raw.toString().toLowerCase() : ''
      return label.includes(term)
    })
  })

  const localSelectedTables = computed({
    get: () => props.selectedTables,
    set: (val) => emit('update:selectedTables', val)
  })

  const showCheckbox = computed({
    get: () => props.showCheckbox,
    set: (val) => emit('update:showCheckbox', val)
  })

  const showCheckboxAndSelectTable = (table) => {
    showCheckbox.value = true
    const set = new Set(localSelectedTables.value)
    set.add(table.name)
    localSelectedTables.value = Array.from(set)
  }

  const closeCheckbox = () => {
    showCheckbox.value = false
    localSelectedTables.value = []
  }

  watch(
    () => props.selectedTables,
    (list) => {
      if (Array.isArray(list)) {
        showCheckbox.value = !!list.length
      }
    },
    { deep: true }
  )
</script>
