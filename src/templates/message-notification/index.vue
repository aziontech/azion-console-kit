<template>
  <div
    :class="`w-full p-6 rounded-lg flex max-md:flex-col gap-4 justify-between items-center flex-row ${messageStyle.messageBg}`"
  >
    <div class="flex gap-3 items-center">
      <div
        :class="`rounded flex items-center justify-center min-w-[3rem] min-h-[3rem] ${messageStyle.iconBg}`"
      >
        <i :class="`${icon || messageStyle.icon} text-2xl ${messageStyle.iconColor}`"></i>
      </div>
      <div class="flex flex-col">
        <h4 class="text-lg font-bold">
          <slot name="title">{{ title }}</slot>
        </h4>
        <p class="w-full max-w-screen-lg text-color-secondary sm:max-w-6xl text-sm">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
    </div>
    <div
      class="flex gap-3 sm:flex-row max-md:w-full flex-col"
      v-if="hasButtons"
    >
      <slot name="actions">
        <PrimeButton
          v-for="(action, index) in buttons"
          :key="index"
          class="w-full min-w-max"
          v-bind="action"
        />
      </slot>
    </div>
  </div>
</template>
<script setup>
  import PrimeButton from 'primevue/button'
  import { computed } from 'vue'

  defineOptions({
    name: 'message-notification'
  })

  const props = defineProps({
    typeMessage: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'warning', 'success', 'error'].includes(value)
    },
    title: {
      type: String,
      default: 'Title (limited to 40 characters)'
    },
    description: {
      type: String,
      default: 'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    },
    icon: {
      type: String,
      default: ''
    },
    buttons: {
      type: Array,
      default: () => []
    }
  })

  const notificationStyles = {
    info: {
      icon: 'pi pi-info-circle',
      messageBg: 'surface-border border surface-card ',
      iconBg: 'bg-[var(--avatar-bg)]'
    },
    warning: {
      icon: 'pi pi-exclamation-triangle',
      messageBg: 'bg-[#FFB64D20]',
      iconBg: 'bg-[#FFB64D20]',
      iconColor: 'text-[#FFB64D]'
    },
    success: {
      icon: 'pi pi-check',
      messageBg: 'bg-[#16A34A20]',
      iconBg: 'bg-[#16A34A20]',
      iconColor: 'text-[#39E478]'
    },
    error: {
      icon: 'pi pi-times-circle',
      messageBg: 'bg-[#F53D3D20]',
      iconBg: 'bg-[#F53D3D20]',
      iconColor: 'text-[#F53D3D]'
    }
  }

  const hasButtons = computed(() => !!props.buttons?.length)

  const messageStyle = computed(() => notificationStyles[props.typeMessage])
</script>
