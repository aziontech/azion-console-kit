<script setup>
  import { ref } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'retained-bindings-notice' })

  defineProps({
    groups: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['create-new-deployment'])

  const collapsed = ref({})
  const toggle = (dsId) => {
    collapsed.value = { ...collapsed.value, [dsId]: !collapsed.value[dsId] }
  }
  const isOpen = (dsId) => collapsed.value[dsId] !== true
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-4)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-5)]"
    data-testid="release-composition__retained"
  >
    <div class="flex items-center gap-[var(--spacing-2)]">
      <i class="pi pi-lock shrink-0 text-body-md text-[var(--text-color-secondary)]" />
      <span class="flex-1 text-body-sm font-semibold text-[var(--text-color)]">
        Retained by policy (STRICT)
      </span>
    </div>

    <p class="text-body-xs text-[var(--text-color-secondary)]">
      These Deployment Settings use strict binding, so resources linked in their first release stay
      linked in every release. This version no longer references the resources below — they are kept
      at their current version. To change what is linked, create a new Deployment Settings and point
      your workloads to it.
    </p>

    <div
      v-for="group in groups"
      :key="group.dsId"
      class="flex flex-col overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)]"
      :data-testid="`release-composition__retained-group-${group.dsId}`"
    >
      <button
        type="button"
        class="flex w-full cursor-pointer items-center gap-[var(--spacing-2)] border-0 bg-transparent px-[var(--spacing-3)] py-[var(--spacing-2)] text-left"
        :aria-expanded="isOpen(group.dsId)"
        :data-testid="`release-composition__retained-group-header-${group.dsId}`"
        @click="toggle(group.dsId)"
      >
        <i class="pi pi-send shrink-0 text-body-md text-[var(--text-color-secondary)]" />
        <span class="flex-1 truncate text-body-sm font-medium text-[var(--text-color)]">
          {{ group.dsName }}
        </span>
        <span
          class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
        >
          {{ group.resources.length }}
        </span>
        <i
          :class="[
            'pi text-[var(--text-color-secondary)] transition-transform',
            isOpen(group.dsId) ? 'pi-chevron-down' : 'pi-chevron-right'
          ]"
        />
      </button>

      <div
        class="collapsible-panel"
        :class="{ 'is-expanded': isOpen(group.dsId) }"
        :aria-hidden="!isOpen(group.dsId)"
      >
        <div class="collapsible-panel__inner">
          <ul
            class="flex flex-col gap-[var(--spacing-2)] border-t border-[var(--surface-border)] p-[var(--spacing-3)]"
          >
            <li
              v-for="resource in group.resources"
              :key="`${resource.type}:${resource.id}`"
              class="flex items-center gap-[var(--spacing-2)]"
              :data-testid="`release-composition__retained-row-${group.dsId}-${resource.type}-${resource.id}`"
            >
              <i
                :class="[resource.icon, 'shrink-0 text-body-sm text-[var(--text-color-secondary)]']"
              />
              <span class="text-body-sm text-[var(--text-color)]">{{ resource.label }}</span>
              <span class="flex-1 min-w-0 truncate text-body-sm text-[var(--text-color-secondary)]">
                {{ resource.name }}
              </span>
              <span
                class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
              >
                {{ resource.version }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex">
      <PrimeButton
        label="Create new Deployment Settings"
        icon="pi pi-arrow-right"
        icon-pos="right"
        severity="secondary"
        outlined
        size="small"
        data-testid="release-composition__retained-create-new"
        @click="emit('create-new-deployment')"
      />
    </div>
  </div>
</template>

<style scoped>
  .collapsible-panel {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 0.2s ease,
      opacity 0.2s ease;
  }
  .collapsible-panel.is-expanded {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  .collapsible-panel__inner {
    min-height: 0;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .collapsible-panel {
      transition: none;
    }
  }
</style>
