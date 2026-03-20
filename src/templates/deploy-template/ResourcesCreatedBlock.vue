<script setup>
  const props = defineProps({
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },
    resources: {
      type: Array,
      default: () => []
      // Expected format: [{ type: 'workload' | 'application' | 'function' | 'firewall', name: 'string' }]
    }
  })

  const resourceLabels = {
    workload: 'Workload',
    application: 'Application',
    function: 'Function',
    firewall: 'Firewall'
  }

  const resourceIcons = {
    workload: 'pi pi-cloud',
    application: 'pi pi-window-maximize',
    function: 'pi pi-code',
    firewall: 'pi pi-shield'
  }
</script>

<template>
  <div
    class="self-stretch bg-[var(--surface-50)] rounded-lg border surface-border flex flex-col md:flex-row gap-5 overflow-hidden"
  >
    <!-- Preview Image -->
    <div class="w-full md:w-80 shrink-0 inline-flex flex-col justify-start items-start gap-4">
      <div
        class="self-stretch h-40 bg-surface-section flex justify-center items-center overflow-hidden"
      >
        <img
          v-if="props.previewSrc"
          :src="props.previewSrc"
          :alt="props.previewAlt"
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- Resources Created Section -->
    <div class="flex-1 self-stretch pr-6 py-4 inline-flex flex-col justify-start items-start gap-3">
      <div class="text-xs font-normal font-['Proto_Mono'] leading-4 text-color-secondary">
        resources created
      </div>

      <div class="flex flex-col justify-start items-start gap-2">
        <div
          v-for="(resource, index) in props.resources"
          :key="index"
          class="inline-flex justify-start items-center gap-1.5"
        >
          <!-- Resource Icon -->
          <div class="w-3.5 h-3.5 relative flex items-center justify-center">
            <i :class="[resourceIcons[resource.type], 'text-color-secondary text-[10px]']" />
          </div>

          <!-- Resource Label -->
          <div class="flex justify-start items-center gap-0.5">
            <span class="text-color-secondary text-xs font-normal font-['Sora'] leading-4">
              {{ resourceLabels[resource.type] }}
            </span>
            <span class="text-color-secondary text-xs font-normal font-['Sora'] leading-4">:</span>
          </div>

          <!-- Resource Name -->
          <span class="text-color text-xs font-normal font-['Sora'] leading-4">
            {{ resource.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
