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
  import { useToast } from '@aziontech/webkit/use-toast'
  import DialogAuthorize from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'

  defineOptions({ name: 'Authorize-Dialog' })

  defineEmits(['authorizeCancel'])

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
      await edgeNodeService.authorizeEdgeNodeService(params.edgeNodeID)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Successfully authorized!'
      })
      dialogRef.value.close({ updated: true })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
      dialogRef.value.close({ updated: false })
    }
  }

  const closeDialog = () => {
    dialogRef.value.close({ updated: false })
  }
</script>
