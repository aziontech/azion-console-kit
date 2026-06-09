<script setup>
  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'dialog-unsaved' })

  defineProps({
    visible: {
      type: Boolean,
      required: true
    }
  })

  const emit = defineEmits(['leave', 'stay'])
</script>

<template>
  <PrimeDialog
    :visible="visible"
    :blockScroll="true"
    modal
    class="w-full max-w-xl"
    :closable="false"
  >
    <template #header>
      <h5 class="text-lg not-italic font-medium leading-5">Unsaved changes</h5>
    </template>
    <div class="text-color-secondary text-sm font-normal leading-5">
      Your changes will be discarded if you leave the page without saving them. Do you want to
      leave?
    </div>
    <template #footer>
      <PrimeButton
        severity="primary"
        size="small"
        label="Leave page"
        data-testid="dialog-unsaved__leave-page"
        outlined
        @click="emit('leave')"
      />
      <PrimeButton
        severity="secondary"
        size="small"
        label="Keep editing"
        @click="emit('stay')"
      />
    </template>
  </PrimeDialog>
</template>
