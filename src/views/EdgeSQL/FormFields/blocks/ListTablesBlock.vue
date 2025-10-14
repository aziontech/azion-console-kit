<template>
  <div class="sm:w-80">
    <div class="flex flex-col w-full gap-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium text-color-primary">Tables</h3>
        <PrimeButton
          icon="pi pi-plus"
          size="small"
          outlined
          @click="handleCreateQuery"
          data-testid="create-table-button"
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
              <span class="text-sm font-medium text-color-primary truncate">{{ table.label }}</span>
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
        outlined
        class="w-full"
        data-testid="quick-templates-button"
        @click="openTemplatesModal"
      >
        <span class="flex items-center gap-2 justify-center w-full">
          <i class="pi pi-bolt" />
          Quick Templates
        </span>
      </PrimeButton>
    </div>
  </div>

  <!-- Quick Templates Modal -->
  <Dialog
    v-model:visible="showTemplatesModal"
    modal
    header="SQL Quick Templates"
    :style="{ width: 'w-full sm:80vw', maxWidth: '62.5rem' }"
    :closable="true"
    @hide="closeTemplatesModal"
  >
    <div class="flex flex-col gap-5">
      <!-- Search Field -->
      <div class="p-input-icon-left sm:w-1/3 w-full">
        <i class="pi pi-search" />
        <InputText
          v-model="templateSearchTerm"
          placeholder="Search templates..."
          class="w-full"
          @input="handleSearchTemplates"
        />
      </div>
      <div class="flex w-full gap-4 flex-wrap">
        <div
          v-for="template in filteredTemplates"
          :key="template.name"
          class="cursor-pointer rounded flex-1 min-w-[300px] border surface-border h-28 p-6 hover:border-[var(--primary-color)]"
          @click="selectTemplate(template)"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{{ template.name }}</span>
          </div>
          <p class="text-sm text-color-secondary mt-2">{{ template.description }}</p>
        </div>
      </div>

      <div
        v-if="filteredTemplates.length === 0"
        class="text-center py-8"
      >
        <i class="pi pi-search text-4xl text-color-secondary mb-3"></i>
        <p class="text-color-secondary m-0">No templates found matching your search.</p>
      </div>
    </div>
  </Dialog>
</template>
<script setup>
  import { computed, watch } from 'vue'
  import { QUICK_TEMPLATES } from '../../constants'
  import { defineProps, defineEmits, ref } from 'vue'
  import Skeleton from 'primevue/skeleton'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import Dialog from 'primevue/dialog'

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
  const showTemplatesModal = ref(false)
  const templateSearchTerm = ref('')
  const filteredTables = computed(() => {
    return props.tablesTree.filter((table) => {
      return table.label.toLowerCase().includes(searchTerm.value.toLowerCase())
    })
  })

  const filteredTemplates = ref(QUICK_TEMPLATES)

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

  const handleSearchTemplates = () => {
    const searchTermTemplate = templateSearchTerm.value || ''
    if (!searchTermTemplate.trim()) {
      filteredTemplates.value = QUICK_TEMPLATES
      return
    }

    filteredTemplates.value = QUICK_TEMPLATES.filter((template) => {
      return (
        template.name.toLowerCase().includes(searchTermTemplate.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTermTemplate.toLowerCase())
      )
    })
  }

  const showTableMenu = (event, table) => {
    emit('show-table-menu', event, table)
  }

  const openTemplatesModal = () => {
    showTemplatesModal.value = true
    templateSearchTerm.value = ''
  }

  const closeTemplatesModal = () => {
    showTemplatesModal.value = false
    templateSearchTerm.value = ''
  }

  const selectTemplate = (template) => {
    emit('use-template', template)
    closeTemplatesModal()
  }

  watch(
    () => props.isLoadingTables,
    () => {
      isLoading.value = props.isLoadingTables
    }
  )
</script>
