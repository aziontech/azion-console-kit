<template>
  <div>
    <div class="flex-shrink-0 bg-surface-0 border-round-lg border-1 surface-border w-80">
      <div class="h-full flex flex-column overflow-hidden">
        <div class="p-4 flex-grow-1 overflow-hidden flex flex-column">
          <h3 class="text-sm font-semibold mb-3 text-color flex items-center gap-2 flex-shrink-0">
            <i class="pi pi-database text-primary"></i>
            Tables
          </h3>

          <div
            v-if="isLoadingTables"
            class="flex-grow-1 overflow-y-auto pr-1"
          >
            <div
              v-for="i in 6"
              :key="`skeleton-${i}`"
              class="flex items-center justify-between px-3 py-2 border-round min-h-10"
            >
              <div class="flex items-center gap-3">
                <Skeleton class="w-5 h-5 border-round flex-shrink-0" />
                <Skeleton class="h-4 w-24" />
              </div>
              <div class="flex-shrink-0">
                <Skeleton class="w-8 h-8 border-round" />
              </div>
            </div>
          </div>

          <div
            v-if="!tablesTree.length"
            class="flex-grow-1"
          >
            <EmptyResultsBlock
              title="No tables found"
              description="Use CREATE TABLE statements to create your first table"
              :documentationService="documentationService"
              :inTabs="true"
              :noBorder="true"
            >
              <template #illustration>
                <i class="pi pi-database text-4xl text-primary opacity-50"></i>
              </template>
            </EmptyResultsBlock>
          </div>

          <div
            v-else
            class="flex-grow-1 overflow-y-auto pr-1"
          >
            <div
              v-for="table in tablesTree"
              :key="table.key"
              class="group flex items-center justify-between px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-round cursor-pointer transition-all duration-200 min-h-10"
              :class="{ 'surface-200': selectedTableName === table.key }"
              @click="selectTable(table)"
            >
              <div class="flex items-center gap-3 text-left w-full">
                <i class="pi pi-table text-primary text-sm flex-shrink-0"></i>
                <span class="text-sm font-medium text-color">{{ table.label }}</span>
              </div>
              <div class="flex-shrink-0">
                <Button
                  icon="pi pi-ellipsis-h"
                  size="small"
                  outlined
                  v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                  class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer table-button"
                  @click.stop="showTableMenu($event, table)"
                  aria-haspopup="true"
                  aria-controls="table_menu"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex-shrink-0 border-top-1 surface-border templates-section"
          :class="{ 'p-4': !isTemplatesCollapsed, 'px-4 py-3': isTemplatesCollapsed }"
        >
          <div
            class="flex items-center justify-between cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors p-2 -m-2 border-round"
            :class="{ 'mb-3': !isTemplatesCollapsed }"
            @click="toggleTemplates"
          >
            <h3 class="text-sm font-semibold text-color flex items-center gap-2">
              <i class="pi pi-bolt text-primary text-lg"></i>
              Quick Templates
            </h3>
            <i
              :class="isTemplatesCollapsed ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="text-color-secondary hover:text-primary text-sm"
            />
          </div>
          <div
            v-show="!isTemplatesCollapsed"
            class="templates-content"
          >
            <div
              class="flex flex-column gap-1 overflow-y-auto"
              style="max-height: 350px"
            >
              <div
                v-for="template in quickTemplates"
                :key="template.name"
                class="group flex items-center gap-3 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-round cursor-pointer transition-colors duration-200 min-h-10"
                @click="useTemplate(template)"
              >
                <i :class="template.icon + ' text-primary text-sm flex-shrink-0'"></i>
                <span class="text-sm font-medium text-color">{{ template.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
  import { computed } from 'vue'
  import { QUICK_TEMPLATES } from '../../constants'
  import { defineProps, defineEmits } from 'vue'
  import Button from 'primevue/button'

  defineProps({
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

  const emit = defineEmits(['select-table'])

  const selectTable = (table) => {
    emit('select-table', table)
  }

  const getTemplateIcon = (templateName) => {
    const icons = {
      'Create Table': 'pi pi-plus',
      'Insert Data': 'pi pi-pencil',
      'Select All': 'pi pi-search',
      'Count Records': 'pi pi-calculator',
      'Update Record': 'pi pi-sync',
      'Delete Record': 'pi pi-trash',
      'Create Index': 'pi pi-bookmark',
      'Drop Table': 'pi pi-times',
      'Alter Table': 'pi pi-wrench',
      'Vector Table': 'pi pi-sitemap',
      'Insert Vectors': 'pi pi-share-alt',
      'Vector Search': 'pi pi-compass',
      'Create Vector Index': 'pi pi-objects-column',
      'Vector Top K Query': 'pi pi-chart-line'
    }
    return icons[templateName] || 'pi pi-code'
  }

  const quickTemplates = computed(() => {
    return QUICK_TEMPLATES.map((template) => ({
      ...template,
      icon: getTemplateIcon(template.name)
    }))
  })
</script>
