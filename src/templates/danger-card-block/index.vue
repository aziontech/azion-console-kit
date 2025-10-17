<template>
  <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-8">
    <div class="space-y-2">
      <h3 class="text-white text-xl font-semibold">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="text-red-200/80 text-sm leading-relaxed"
      >
        {{ description }}
      </p>
    </div>

    <div class="pt-8">
      <PrimeButton
        :label="buttonLabel"
        danger
        icon="pi pi-trash"
        size="small"
        @click="handleAction"
        :loading="loading"
        :disabled="disabled"
        :pt="{
          root: { class: 'p-button-danger' },
          label: { class: 'font-medium' }
        }"
      />
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'

  defineOptions({
    name: 'DangerCard'
  })

  const emit = defineEmits(['action'])

  defineProps({
    title: {
      type: String,
      default: 'Danger area'
    },
    description: {
      type: String,
      default: null
    },
    buttonLabel: {
      type: String,
      default: 'Delete'
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  })

  const handleAction = () => {
    emit('action')
  }
</script>
