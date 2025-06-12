<template>
  <div
    :class="`w-full p-6 rounded-lg flex flex-col gap-4 justify-between items-center sm:flex-row mt-8 ${style.bg}`"
  >
    <div class="flex gap-3 items-center">
      <div
        :class="`rounded flex items-center justify-center min-w-[3rem] min-h-[3rem] ${style.iconBg}`"
      >
        <i :class="`${style.icon} text-2xl ${style.iconColor}`"></i>
      </div>
      <div class="flex flex-col">
        <h4 class="text-lg font-bold text-white">
          <slot name="title">{{ title }}</slot>
        </h4>
        <p class="text-[#bdbdbd] w-full max-w-screen-lg sm:max-w-6xl text-sm">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
    </div>
    <div class="flex gap-3 sm:flex-row flex-col">
      <slot name="actions">
        <PrimeButton
          v-for="(button, index) in buttons"
          :key="index"
          class="w-full min-w-max"
          :icon="button.icon"
          :label="button.label"
          :outlined="button.outlined"
          :severity="button.severity"
          :disabled="button.disabled"
          @click="button.onClick"
        />
      </slot>
    </div>
  </div>
</template>
<script setup>
  import PrimeButton from 'primevue/button'
  import { computed } from 'vue'

  defineOptions({
    name: 'notification-payment'
  })

  const props = defineProps({
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'warning', 'success', 'error'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    buttons: {
      type: Array,
      default: () => [
        {
          icon: 'pi pi-plus',
          label: 'Button',
          outlined: true,
          onClick: () => {}
        },
        {
          icon: 'pi pi-plus',
          label: 'Button',
          onClick: () => {}
        }
      ]
    }
  })

  const notificationStyles = {
    info: {
      icon: 'pi pi-info-circle',
      bg: 'bg-[#232323] border border-[#393939]',
      iconBg: 'bg-[#393939]',
      iconColor: 'text-[#bdbdbd]'
    },
    warning: {
      icon: 'pi pi-exclamation-triangle',
      bg: 'bg-[#5a4324]',
      iconBg: 'bg-[#a67c38]',
      iconColor: 'text-[#fff]'
    },
    success: {
      icon: 'pi pi-check',
      bg: 'bg-[#13351e]',
      iconBg: 'bg-[#1e6b3a]',
      iconColor: 'text-[#fff]'
    },
    error: {
      icon: 'pi pi-times-circle',
      bg: 'bg-[#3d181a]',
      iconBg: 'bg-[#a63a38]',
      iconColor: 'text-[#fff]'
    }
  }
  const style = computed(() => notificationStyles[props.type])
</script>
