<script setup>
  defineOptions({ name: 'resource-types-list' })

  defineProps({
    items: {
      type: Array,
      default: () => []
    }
  })
</script>

<template>
  <div
    v-if="items.length"
    class="flex flex-col gap-1"
    data-testid="resource-types-list"
  >
    <div
      v-for="item in items"
      :key="item.type"
      class="flex items-center gap-3 p-1"
    >
      <i
        :class="[item.icon, 'text-xs']"
        aria-hidden="true"
      />
      <span class="text-xs leading-none text-color whitespace-nowrap">
        {{ item.label }}
      </span>
    </div>
  </div>
  <span
    v-else
    class="text-xs text-color-secondary"
  >
    --
  </span>
</template>
