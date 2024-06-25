<template>
  <div>
    <DialogAuthorize
      v-model:visible="authorizeDialogVisible"
      modal
      header="Are you sure?"
      class="w-[40vw]"
    >
      <p class="text-color-secondary">1 nodes will be authorized.</p>

      <template #footer>
        <div class="flex gap-2 flex-col-reverse lg:flex-row justify-end">
          <PrimeButton
            severity="primary"
            outlined
            label="Cancel"
            @click="authorizeDialogVisible = false"
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

<script>
  import DialogAuthorize from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import * as EdgeNodeService from '@/services/edge-node-services'

  export default {
    name: 'Authorize-Dialog',

    props: {
      authorize: {
        required: true,
        type: Object
      }
    },

    components: {
      DialogAuthorize,
      PrimeButton
    },

    data() {
      return {
        authorizeDialogVisible: false
      }
    },

    methods: {
      async authorizeEdgeNode() {
        try {
          this.$toast.add({
            closable: true,
            severity: 'info',
            summary: 'Processing request'
          })
          await EdgeNodeService.authorizeEdgeNodeService(this.authorize.edgeNodeID)
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        } finally {
          this.$toast.add({
            closable: true,
            severity: 'success',
            summary: 'Edge Nodes authorized successfully!'
          })
          this.authorizeDialogVisible = false
        }
      }
    },

    watch: {
      authorize: {
        deep: true,
        handler() {
          this.authorizeDialogVisible = this.authorize.openDialog
        }
      },
      authorizeDialogVisible() {
        if (!this.authorizeDialogVisible) {
          this.$emit('authorizeCancel')
        }
      }
    }
  }
</script>
