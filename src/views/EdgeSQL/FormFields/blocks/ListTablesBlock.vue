<template>
  <div>
    <div class="sm:w-80">
      <div class="flex flex-col w-80 gap-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-color-primary">Tables</h3>
          <PrimeButton
            icon="pi pi-plus"
            size="small"
            outlined
            @click="handleCreateQuery"
            data-testid="create-bucket-button"
            class="w-8 h-8 p-0 flex items-center justify-center"
          />
        </div>

        <div class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText
            v-model="searchTerm"
            placeholder="Search tables"
            class="w-full"
            @input="handleSearch"
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
          <div v-else>
            <div
              v-for="table in filteredTables"
              :key="table.id"
              class="group p-2 rounded cursor-pointer hover:bg-[--table-bg-color] transition-colors"
              :class="{ 'bg-[--table-bg-color]': selectedTableName === table.label }"
              @click="selectTable(table)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-color-primary truncate">{{
                  table.label
                }}</span>
                <span class="text-xs text-color-secondary">{{ table.rows }}</span>

                <PrimeButton
                  icon="pi pi-ellipsis-h"
                  size="small"
                  outlined
                  @click.stop="showTableMenu($event, table)"
                  data-testid="table-menu-button"
                  class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        <PrimeButton
          icon="pi pi-bolt"
          size="small"
          outlined
          label="Quick Templates"
          data-testid="table-menu-button"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
  import { computed, watch } from 'vue'
  // import { QUICK_TEMPLATES } from '../../constants'
  import { defineProps, defineEmits, ref } from 'vue'
  import Skeleton from 'primevue/skeleton'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'

  const emit = defineEmits(['select-table', 'show-table-menu', 'use-template', 'create-table'])

  const props = defineProps({
    tablesTree: {
      type: Array,
      default: () => []
    },
    isLoadingTables: {
      type: Boolean,
      default: false
    },
    isTemplatesCollapsed: {
      type: Boolean,
      default: false
    },
    selectedTableName: {
      type: String,
      default: null
    },
    documentationService: {
      type: Function,
      default: () => {}
    }
  })

  const searchTerm = ref('')
  const isLoading = ref(false)
  const filteredTables = computed(() => {
    return props.tablesTree.filter((table) => {
      return table.label.toLowerCase().includes(searchTerm.value.toLowerCase())
    })
  })

  const handleCreateQuery = () => {
    emit('create-table')
  }

  const handleSearch = () => {
    filteredTables.value = props.tablesTree.filter((table) => {
      return table.label.toLowerCase().includes(searchTerm.value.toLowerCase())
    })
  }

  const selectTable = (table) => {
    emit('select-table', table)
  }

  const showTableMenu = (event, table) => {
    emit('show-table-menu', event, table)
  }

  watch(
    () => props.isLoadingTables,
    () => {
      isLoading.value = props.isLoadingTables
    }
  )
</script>
