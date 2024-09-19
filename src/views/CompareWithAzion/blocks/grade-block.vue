<template>
  <div class="rounded surface-border border">
    <div
      v-if="props.items.length === 0 || !props.items"
      class="text-center py-40"
    >
      <i class="pi pi-spin pi-spinner"></i>
    </div>

    <ul
      v-if="props.items"
      class="grid grid-cols-2 p-0 m-0"
    >
      <li
        v-for="item in props.items"
        :key="item.label"
        class="p-4 surface-border border p-0 m-0"
      >
        <p>
          <small class="font-semibold">{{ item.label }}</small>
        </p>
        <p class="text-2xl font-bold">
          {{ item.value }}<small class="text-sm">{{ item.measure }}</small>
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const props = defineProps({
    items: ref({
      type: Array,
      required: true
    })
  })
</script>
