<script setup>
  import CopyBlock from '@aziontech/webkit/button-copy'

  defineOptions({ name: 'grouped-list' })

  defineProps({
    groups: {
      type: Array,
      default: () => []
    },
    groupIcon: {
      type: String,
      default: 'pi pi-link'
    },
    itemIcon: {
      type: String,
      default: 'pi pi-globe'
    },
    emptyLabel: {
      type: String,
      default: 'No items'
    },
    dataTestid: {
      type: String,
      default: 'grouped-list'
    }
  })
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :data-testid="dataTestid"
  >
    <div
      v-for="group in groups"
      :key="group.key"
      class="flex flex-col gap-2"
      :data-testid="`${dataTestid}__group-${group.key}`"
    >
      <slot
        name="group-header"
        :group="group"
      >
        <div class="flex items-center gap-2">
          <i
            :class="group.icon || groupIcon"
            class="text-color-secondary text-xs"
          />
          <span class="text-[10px] uppercase tracking-wider text-color-secondary">
            {{ group.label }}
          </span>
        </div>
      </slot>

      <div class="grouped-list__items flex flex-col">
        <small
          v-if="!group.items?.length"
          class="text-color-secondary text-xs py-1 pl-4"
        >
          {{ emptyLabel }}
        </small>
        <div
          v-for="item in group.items"
          :key="item.key"
          class="grouped-list__item"
        >
          <slot
            name="item"
            :item="item"
            :group="group"
          >
            <div class="flex items-center justify-between py-1.5 gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <i
                  :class="itemIcon"
                  class="text-color-secondary text-sm shrink-0"
                />
                <span class="text-xs truncate">{{ item.label }}</span>
              </div>
              <slot
                name="item-action"
                :item="item"
                :group="group"
              >
                <CopyBlock
                  v-if="item.value"
                  :value="item.value"
                />
              </slot>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .grouped-list__items {
    position: relative;
    padding-left: 1.25rem;
    margin-left: 0.375rem;
  }
  .grouped-list__item {
    position: relative;
  }
  .grouped-list__item::before {
    content: '';
    position: absolute;
    left: -0.875rem;
    top: 0;
    width: 0.625rem;
    height: 50%;
    border-left: 1px solid var(--surface-border);
    border-bottom: 1px solid var(--surface-border);
    border-bottom-left-radius: 4px;
  }
  .grouped-list__item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: -0.875rem;
    top: 50%;
    width: 1px;
    height: 50%;
    background-color: var(--surface-border);
  }
</style>
