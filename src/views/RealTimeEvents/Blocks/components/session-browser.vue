<script setup>
  import { ref, computed } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import InputText from '@aziontech/webkit/inputtext'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeMenu from '@aziontech/webkit/menu'

  defineOptions({ name: 'SessionBrowser' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    panels: {
      type: Array,
      default: () => []
    },
    activePanel: {
      type: String,
      default: null
    },
    // When true, Edit/Delete controls on custom sessions are hidden from the
    // UI. Session creation is also disabled upstream, so this keeps the
    // browser strictly read-only while custom sessions are a roadmap feature.
    readOnly: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:visible', 'select', 'edit', 'delete'])

  const searchQuery = ref('')
  const menuRef = ref()
  const menuTargetPanel = ref(null)

  const predefinedPanels = computed(() => {
    const query = searchQuery.value.toLowerCase()
    return props.panels
      .filter((panel) => panel.type === 'predefined')
      .filter((panel) => !query || panel.label.toLowerCase().includes(query))
  })

  const customPanels = computed(() => {
    const query = searchQuery.value.toLowerCase()
    return props.panels
      .filter((panel) => panel.type === 'custom')
      .filter((panel) => !query || panel.label.toLowerCase().includes(query))
  })

  const menuItems = computed(() => [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        if (menuTargetPanel.value) {
          emit('edit', menuTargetPanel.value.id)
        }
      }
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        if (menuTargetPanel.value) {
          emit('delete', menuTargetPanel.value.id)
        }
      }
    }
  ])

  const toggleSidebar = (value) => {
    emit('update:visible', value)
  }

  const selectPanel = (panelId) => {
    emit('select', panelId)
    emit('update:visible', false)
  }

  const toggleMenu = (event, panel) => {
    menuTargetPanel.value = panel
    menuRef.value.toggle(event)
  }

  const isActive = (panelId) => {
    return props.activePanel === panelId
  }
</script>

<template>
  <Sidebar
    :visible="props.visible"
    @update:visible="toggleSidebar"
    position="right"
    dismissable
    showCloseIcon
    :pt="{
      root: { class: 'max-w-md w-full' },
      headercontent: { class: 'flex items-center w-full' },
      content: { class: 'p-0 flex flex-col overflow-hidden' }
    }"
  >
    <template #header>
      <span class="text-base font-semibold text-color">Add to tabs</span>
    </template>

    <div class="flex flex-col h-full overflow-hidden">
      <!-- Search -->
      <div class="p-3 border-b surface-border">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Search sessions..."
            class="w-full h-8 text-sm"
            data-testid="session-browser-search"
          />
        </span>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Log Explorer option -->
        <div class="px-3 py-2 border-b surface-border">
          <div
            class="session-browser__item"
            :class="{ 'session-browser__item--active': activePanel === null }"
            data-testid="session-item-log-explorer"
            @click="selectPanel(null)"
          >
            <i class="pi pi-list text-base text-color-secondary" />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-sm font-medium text-color truncate">Log Explorer</span>
              <span class="text-xs text-color-secondary truncate">Default events explorer</span>
            </div>
          </div>
        </div>

        <!-- Predefined sessions -->
        <div
          v-if="predefinedPanels.length"
          class="border-b surface-border"
        >
          <div class="px-3 py-2">
            <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
              Predefined
            </span>
          </div>
          <div class="flex flex-col">
            <div
              v-for="panel in predefinedPanels"
              :key="panel.id"
              class="session-browser__item"
              :class="{ 'session-browser__item--active': isActive(panel.id) }"
              :data-testid="`session-item-${panel.id}`"
              @click="selectPanel(panel.id)"
            >
              <i
                :class="panel.icon"
                class="text-base text-color-secondary"
              />
              <div class="flex flex-col flex-1 min-w-0">
                <span class="text-sm font-medium text-color truncate">{{ panel.label }}</span>
                <span class="text-xs text-color-secondary truncate">{{ panel.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom sessions -->
        <div v-if="customPanels.length">
          <div class="px-3 py-2">
            <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
              My Sessions
            </span>
          </div>
          <div class="flex flex-col">
            <div
              v-for="panel in customPanels"
              :key="panel.id"
              class="session-browser__item"
              :class="{ 'session-browser__item--active': isActive(panel.id) }"
              :data-testid="`session-item-${panel.id}`"
              @click="selectPanel(panel.id)"
            >
              <i
                :class="panel.icon"
                class="text-base text-color-secondary"
              />
              <div class="flex flex-col flex-1 min-w-0">
                <span class="text-sm font-medium text-color truncate">{{ panel.label }}</span>
                <span class="text-xs text-color-secondary truncate">{{ panel.description }}</span>
              </div>
              <PrimeButton
                v-if="!readOnly"
                icon="pi pi-ellipsis-v"
                text
                rounded
                size="small"
                class="!w-7 !h-7 flex-shrink-0"
                aria-label="Session actions"
                data-testid="session-action-menu-button"
                @click.stop="toggleMenu($event, panel)"
              />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="!predefinedPanels.length && !customPanels.length"
          class="p-4 text-center"
        >
          <span class="text-sm text-color-secondary">No sessions match your search.</span>
        </div>
      </div>
    </div>

    <PrimeMenu
      ref="menuRef"
      :model="menuItems"
      :popup="true"
      data-testid="session-action-menu"
    />
  </Sidebar>
</template>

<style scoped>
  .session-browser__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .session-browser__item:hover {
    background-color: var(--surface-hover);
  }

  .session-browser__item--active {
    background-color: var(--highlight-bg);
  }
</style>
