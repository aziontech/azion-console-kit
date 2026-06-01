<script setup>
  import IconButton from '@aziontech/webkit/icon-button'

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
          <IconButton
            kind="transparent"
            size="medium"
            icon="pi pi-question-circle"
            v-tooltip="props.tooltipMessage"
            class="max-md:hidden"
            aria-label="button"
          />
        </span>

        <IconButton
          kind="transparent"
          size="medium"
          icon="pi pi-question-circle"
          v-tooltip.focus="props.tooltipMessage"
          class="whitespace-nowrap md:hidden"
          aria-label="button"
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
