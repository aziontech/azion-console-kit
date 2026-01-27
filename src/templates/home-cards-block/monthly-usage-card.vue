<template>
  <HomeCardBlock title="Monthly Usage">
    <template #content>
      <div class="p-4 flex flex-col gap-2.5">
        <div
          v-for="(item, index) in usageData"
          :key="index"
          class="flex items-start justify-between text-xs"
        >
          <span class="text-[var(--text-color-secondary)]">{{ item.label }}</span>
          <span class="text-[var(--text-color)]">{{ item.value }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <span
        class="text-xs text-[var(--text-color-link)] text-center cursor-pointer hover:underline w-full"
        @click="$emit('viewAll')"
      >
        View all Usage...
      </span>
    </template>
  </HomeCardBlock>
</template>

<script setup>
  import HomeCardBlock from './index.vue'

  defineOptions({ name: 'MonthlyUsageCard' })

  defineProps({
    usageData: {
      type: Array,
      required: true
    }
  })

  defineEmits(['viewAll'])
</script>
