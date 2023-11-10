<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visibleDialog"
      @update:visible="openDialogUnsaved"
      modal
      :closable="false"
      :pt="{
        root: { class: 'p-0 w-[576px]' },
        header: { class: 'flex pt-5 pb-5 items-center self-stretch border-b border-solid' },
        content: { class: 'p-0 h-full' },
        footer: {
          class: 'flex p-5 justify-end items-end border-t border-solid'
        }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">Unsaved changes</h5>
      </template>
      <div class="flex p-5 items-center flex-1 text-secondary-color text-sm font-normal leading-5">
        There are unsaved changes. Do you want to leave without finishing?
      </div>
      <template #footer>
        <PrimeButton
          severity="primary"
          label="Leave page"
          outlined
          @click="onLeavePage"
        />
        <PrimeButton
          severity="secondary"
          label="Keep editing"
          @click="onKeepEditing"
        />
      </template>
    </PrimeDialog>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'dialog-unsaved-block' })
  const emit = defineEmits(['update:visible', 'keepEditing', 'leavePage'])

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true
    }
  })

  const visibleDialog = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const openDialogUnsaved = (value) => {
    visibleDialog.value = value
  }

  const onLeavePage = () => {
    emit('leavePage')
  }

  const onKeepEditing = () => {
    emit('keepEditing')
  }
</script>
