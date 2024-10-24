<script setup>
  import { ref } from 'vue'
  import SelectButton from 'primevue/selectbutton'
  import { useLayout } from '@/composables/useLayout'

  const value = ref('Azion Copilot')
  const options = ref(['Azion Copilot', 'Documentation'])

  const { isSidebarActive } = useLayout()
</script>

<template>
  <div
    :class="[
      'border fixed flex flex-col min-h-screen pt-14 right-0 surface-border transition-transform w-[32rem] duration-200',
      isSidebarActive ? 'translate-x-0' : 'translate-x-full'
    ]"
  >
    <div class="flex flex-col h-full">
      <div class="card flex mt-3 !border-none px-8">
        <SelectButton
          v-model="value"
          :options="options"
          aria-labelledby="basic"
        />
      </div>
    </div>
  </div>
</template>
