<template>
  <div>
    <PrimeButton
      icon="pi pi-filter"
      label="Advanced Filter"
      outlined
      size="small"
      @click="toggleOverPanel"
    />

    <!-- OverPanel -->
    <OverlayPanel
      ref="overPanelRef"
      appendTo="body"
      aria-haspopup="true"
      aria-controls="overlay_panel"
      class="max-h-[500px]"
      :pt="{
        root: { class: 'p-0 md:w-[90%] max-sm:w-full' },
        content: { class: 'p-0' }
      }"
    >
      <div class="border-b px-8 py-5 justify-between surface-border flex">
        <h3 class="text-lg font-semibold text-color">Add filter</h3>
        <PrimeButton
          icon="pi pi-times"
          severity="primary"
          outlined
          @click="toggleOverPanel"
        />
      </div>

      <div class="px-8 py-5 flex gap-3.5 flex-col">
        <div
          v-for="(group, groupIndex) in model"
          :key="groupIndex"
        >
          <div>drag</div>
          <div>row {{ group }}</div>
          <div>actions</div>
        </div>
      </div>

      <div>preview {{ filterGroups }}</div>

      <div class="px-8 py-5 flex gap-3.5 flex-col">
        <label class="custom-label-title">Custom label (optional)</label>
        <InputText
          v-model="customLabel"
          placeholder="Add a custom label here"
          class="custom-label-input"
          @input="updateCustomLabel"
        />
      </div>

      <div
        class="px-8 py-3 border-t surface-border flex gap-2 items-center justify-end p-dialog-footer"
      >
        <PrimeButton
          type="button"
          label="Cancel"
          @click="cancel"
          class="max-md:min-w-max"
          severity="primary"
          size="small"
          outlined
          data-testid="filter-cancel-button"
        />
        <PrimeButton
          type="button"
          class="max-md:w-full"
          label="Add filter"
          severity="secondary"
          size="small"
          @click="addFilter"
          data-testid="filter-apply-button"
        />
      </div>
    </OverlayPanel>
  </div>
  <!-- {{ model }}
  {{ props.fields }} -->
</template>

<script setup>
  import { ref, defineModel } from 'vue'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import OverlayPanel from 'primevue/overlaypanel'

  // Model
  const model = defineModel({
    type: Array,
    default: () => []
  })

  // Props
  const props = defineProps({
    fields: {
      type: Array,
      default: () => []
    }
  })

  // Component name
  defineOptions({ name: 'AdvancedFilter' })

  // Refs
  const filterGroups = ref([])
  const customLabel = ref('')

  // OverPanel refs
  const overPanelRef = ref(null)

  // OverPanel methods
  const toggleOverPanel = (event) => {
    overPanelRef.value.toggle(event)
  }

  const addFilter = () => {}

  const cancel = () => {
    filterGroups.value = []
    customLabel.value = ''
    overPanelRef.value.hide()
  }

  const updateCustomLabel = () => {
    // Handle custom label update
  }
</script>
