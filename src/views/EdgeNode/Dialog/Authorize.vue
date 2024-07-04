<template>
  <div>
    <DialogAuthorize
      :blockScroll="true"
      visible
      modal
      header="Authorize Nodes"
      class="w-[40vw]"
    >
      <p class="text-color-secondary">The selected node(s) will be authorized.</p>

      <template #closeicon>
        <PrimeButton
          outlined
          @click="closeDialog()"
          icon="pi pi-times"
        />
      </template>

      <template #footer>
        <div class="flex gap-2 flex-col-reverse lg:flex-row justify-end">
          <PrimeButton
            severity="primary"
            outlined
            label="Cancel"
            @click="closeDialog()"
          ></PrimeButton>
          <PrimeButton
            severity="primary"
            label="Confirm"
            @click="authorizeEdgeNode()"
          ></PrimeButton>
        </div>
      </template>
    </DialogAuthorize>
  </div>
</template>

<script setup>
  import { inject } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import DialogAuthorize from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import * as EdgeNodeService from '@/services/edge-node-services'

  defineOptions({ name: 'Authorize-Dialog' })

  const emit = defineEmits(['authorizeCancel'])

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const params = dialogRef.value.data

  const authorizeEdgeNode = async () => {
    try {
      toast.add({
        closable: true,
        severity: 'info',
        summary: 'Processing request'
      })
      await EdgeNodeService.authorizeEdgeNodeService(params.edgeNodeID)
      emit('authorizeCancel')
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Successfully authorized!'
      })
      closeDialog()
    }
  }

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
