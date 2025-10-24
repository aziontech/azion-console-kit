<script setup>
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'big-number' })
  const props = defineProps({
    label: {
      type: String,
      required: true
    },
    sufix: {
      type: String,
      required: false
    },
    tooltipMessage: {
      type: String,
      required: false
    }
  })

  defineExpose({ props })
</script>

<template>
  <div class="flex items-start justify-start">
    <div class="flex flex-col w-full">
      <label class="flex text-sm gap-1 items-center font-medium">
        {{ props.label }}

        <span>
          <PrimeButton
            class="max-md:hidden"
            icon="pi pi-question-circle"
            text
            rounded
            v-tooltip="props.tooltipMessage"
            :pt="{
              root: { class: 'shadow-none' }
            }"
          />
        </span>

        <PrimeButton
          class="whitespace-nowrap md:hidden"
          icon="pi pi-question-circle"
          text
          rounded
          v-tooltip.focus="props.tooltipMessage"
        />
      </label>
      <div class="flex gap-1 items-center">
        <span class="text-2xl font-medium">
          <slot></slot>
        </span>
        <span class="text-sm text-color">{{ props.sufix }}</span>
      </div>
    </div>
  </div>
</template>
