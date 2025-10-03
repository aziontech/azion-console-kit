<template>
  <div
    class="mt-4 pt-4 border-t surface-border"
    v-if="activeTab !== 2"
  >
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-color">
        {{ editingField === 'start' ? 'Start Date' : 'End Date' }}
      </label>
      <div class="flex items-center gap-2">
        <InputText
          :model-value="inputValue"
          @update:model-value="$emit('inputChange', $event)"
          :placeholder="editingField === 'start' ? startDateInput : endDateInput"
          class="w-full transition-all duration-200"
          :readonly="activeTab !== 0"
          @keydown.enter="$emit('updateRange')"
          :pt="{
            root: {
              class: 'transition-all duration-200'
            }
          }"
        />
        <template v-if="activeTab === 0">
          <PrimeButton
            icon="pi pi-check"
            size="small"
            severity="success"
            @click="$emit('updateRange')"
            :pt="{
              root: { class: 'transition-all duration-200 hover:scale-105' }
            }"
          />
          <PrimeButton
            label="Today"
            class="min-w-max"
            size="small"
            outlined
            @click="$emit('setToNow')"
            :pt="{
              root: { class: 'transition-all duration-200 hover:scale-105' }
            }"
          />
        </template>
      </div>
      <div
        v-if="activeTab === 0"
        class="text-xs text-color-secondary"
      >
        Enter date in DD/MM/YYYY format or use the calendar above
      </div>
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'

  defineOptions({ name: 'DateInputSection' })

  defineProps({
    activeTab: {
      type: Number,
      required: true
    },
    editingField: {
      type: String,
      required: true
    },
    inputValue: {
      type: String,
      required: true
    },
    startDateInput: {
      type: String,
      required: true
    },
    endDateInput: {
      type: String,
      required: true
    }
  })

  defineEmits(['inputChange', 'updateRange', 'setToNow'])
</script>
