<template>
  <!-- Quick Templates Modal -->
  <Dialog
    v-model:visible="visibleDialog"
    modal
    header="SQL Quick Templates"
    :style="{ width: 'w-full sm:80vw', maxWidth: '62.5rem' }"
    :closable="true"
    @hide="closeTemplatesModal"
  >
    <div class="flex flex-col gap-5">
      <!-- Search Field -->
      <div class="p-input-icon-left sm:w-1/3 w-full">
        <i class="pi pi-search" />
        <InputText
          v-model="templateSearchTerm"
          placeholder="Search templates..."
          class="w-full"
          @input="handleSearchTemplates"
        />
      </div>
      <div class="flex w-full gap-4 flex-wrap">
        <div
          v-for="template in filteredTemplates"
          :key="template.name"
          class="cursor-pointer rounded flex-1 min-w-[300px] border surface-border h-28 p-6 hover:border-[var(--primary-color)]"
          @click="selectTemplate(template)"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{{ template.name }}</span>
          </div>
          <p class="text-sm text-color-secondary mt-2">{{ template.description }}</p>
        </div>
      </div>

      <div
        v-if="filteredTemplates.length === 0"
        class="text-center py-8"
      >
        <i class="pi pi-search text-4xl text-color-secondary mb-3"></i>
        <p class="text-color-secondary m-0">No templates found matching your search.</p>
      </div>
    </div>
  </Dialog>
</template>
<script setup>
  import { ref, computed } from 'vue'
  import Dialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import { QUICK_TEMPLATES } from '../constants/queries'

  const emit = defineEmits(['use-template', 'update:showTemplatesModal'])
  const props = defineProps({
    showTemplatesModal: {
      type: Boolean,
      default: false
    }
  })

  const templateSearchTerm = ref('')
  const filteredTemplates = ref(QUICK_TEMPLATES)

  const visibleDialog = computed({
    get: () => props.showTemplatesModal,
    set: (value) => {
      emit('update:showTemplatesModal', value)
    }
  })

  const handleSearchTemplates = () => {
    const searchTermTemplate = templateSearchTerm.value || ''
    if (!searchTermTemplate.trim()) {
      filteredTemplates.value = QUICK_TEMPLATES
      return
    }

    filteredTemplates.value = QUICK_TEMPLATES.filter((template) => {
      return (
        template.name.toLowerCase().includes(searchTermTemplate.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTermTemplate.toLowerCase())
      )
    })
  }

  const selectTemplate = (template) => {
    emit('use-template', template)
  }

  const closeTemplatesModal = () => {
    emit('update:showTemplatesModal', false)
  }
</script>
