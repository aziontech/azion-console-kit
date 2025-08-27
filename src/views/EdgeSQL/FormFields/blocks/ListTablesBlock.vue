<template>
  <div>
    <div class="sm:w-80">
      <div class="h-full flex flex-column overflow-hidden">
        <PanelMenu
          :model="listTablesMenu"
          multiple
          class="w-full md:w-20rem"
          :tabindex="0"
        >
          <template #item="{ item }">
            <div class="flex align-items-center justify-between">
              <a
                v-ripple
                class="flex align-items-center px-3 py-2 cursor-pointer group"
              >
                <span :class="[item.icon, 'text-primary']" />
                <span :class="['ml-2', { 'font-semibold': item.items }]">{{ item.label }}</span>
              </a>

              <Button
                v-if="item.showButton"
                icon="pi pi-ellipsis-h"
                size="small"
                outlined
                v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                class=""
                @click.stop="showTableMenu($event, item)"
                aria-haspopup="true"
                aria-controls="table_menu"
              />
            </div>
          </template>
        </PanelMenu>
      </div>
    </div>
  </div>
</template>
<script setup>
  import { computed } from 'vue'
  import { QUICK_TEMPLATES } from '../../constants'
  import { defineProps, defineEmits } from 'vue'
  import PanelMenu from 'primevue/panelmenu'
  import Button from 'primevue/button'

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

  const emit = defineEmits(['select-table', 'show-table-menu', 'use-template'])

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

  const quickTemplatesMenu = computed(() => {
    const list = quickTemplates.value.map((template) => ({
      label: template.name,
      icon: template.icon,
      command: () => useTemplate(template)
    }))

    return [
      {
        label: 'Quick Templates',
        icon: 'pi pi-bolt',
        items: list
      }
    ]
  })

  const useTemplate = (template) => {
    emit('use-template', template)
  }

  const showTableMenu = (event, table) => {
    emit('show-table-menu', event, table)
  }

  const listTablesMenu = computed(() => {
    const list = props.tablesTree.map((table) => ({
      label: table.label,
      icon: 'pi pi-table',
      command: () => selectTable(table),
      showButton: true,
      ...table
    }))

    return [
      {
        label: 'Tables',
        icon: 'pi pi-database',
        items: list,
        showButton: false
      },
      ...quickTemplatesMenu.value
    ]
  })
</script>
