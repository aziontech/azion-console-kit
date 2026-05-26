<template>
  <div class="rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] p-4">
    <div class="grid grid-cols-2 gap-x-6 gap-y-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-color">{{ fromPlanLabel }}</span>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-500/15 text-orange-500 border border-orange-500/30"
          >Actual Plan</span
        >
      </div>
      <div class="flex items-center">
        <span class="text-sm font-semibold text-color">{{ toPlanLabel }}</span>
      </div>

      <template
        v-for="row in rows"
        :key="row.id"
      >
        <div class="flex items-center gap-2 text-sm text-color">
          <i class="pi pi-check text-success-check text-base" />
          <span>{{ row.from }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-color-secondary">
          <i class="pi pi-times text-color-secondary text-base" />
          <span>{{ row.to }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
  defineOptions({ name: 'plan-feature-comparison' })

  defineProps({
    fromPlanLabel: { type: String, default: 'Pro' },
    toPlanLabel: { type: String, default: 'Hobby' },
    rows: {
      type: Array,
      default: () => [
        { id: 'workloads', from: '20 Workloads', to: '1 Workload' },
        { id: 'requests', from: '20M Application requests', to: '1M Application requests' },
        { id: 'compute', from: '10h Function compute', to: '2h Function compute' },
        { id: 'storage', from: '20GB Object Storage', to: '5GB Object Storage' }
      ]
    }
  })
</script>
