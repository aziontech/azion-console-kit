<template>
  <PrimeDialog
    v-model:visible="deleteDialogVisible"
    modal
    :header="`Delete ${informationForDeletion.title}`"
    class="w-[40vw]"
  >
    <div class="flex flex-col gap-5">
      <div>
        <Message
          class="w-100"
          severity="warn"
          :closable="false"
          >Warning: This action is not reversible. Please be certain.</Message
        >

        <p class="pt-3.5 text-color-secondary">
          This Edge Application will be deleted along, Device Groups, Origins settings, Cache
          Settings and Rule Sets.
        </p>
      </div>

      <Divider class="-ml-5 w-[calc(100%_+_40px)]" />

      <div>
        <div class="flex flex-col gap-2">
          <label
            class="font-semibold text-sm"
            for="confirm-input"
          >
            To confirm, type “delete” in the box below:
          </label>
          <InputText
            id="confirm-input"
            type="text"
            v-model="confirmDeleteText"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 flex-col-reverse lg:flex-row justify-end">
        <PrimeButton
          severity="primary"
          outlined
          label="Cancel"
          class="m-0"
          @click="cancelDialog()"
        ></PrimeButton>
        <PrimeButton
          :disabled="enableDeleteButton"
          severity="danger"
          label="Delete"
          @click="removeItem()"
        ></PrimeButton>
      </div>
    </template>
  </PrimeDialog>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import Message from 'primevue/message'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'

  export default {
    props: {
      informationForDeletion: {
        type: Object,
        required: true
      }
    },

    components: {
      PrimeButton,
      PrimeDialog,
      Message,
      InputText,
      Divider
    },

    data() {
      return {
        deleteDialogVisible: false,
        confirmDeleteText: '',
        processOfExclusion: false
      }
    },

    methods: {
      async removeItem() {
        this.processOfExclusion = true
        let toastConfig = {
          closable: false,
          severity: 'success',
          summary: '',
          life: 10000
        }

        try {
          const feedback = await this.informationForDeletion.deleteService(
            this.informationForDeletion.selectedID
          )
          toastConfig.summary = feedback ?? 'Deleted successfully'
          this.deleteDialogVisible = false
          this.$emit('successfullyDeleted')
        } catch (error) {
          toastConfig = {
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          }
        } finally {
          this.$toast.add(toastConfig)
          this.processOfExclusion = false
        }
      },

      cancelDialog() {
        this.deleteDialogVisible = false
      }
    },

    computed: {
      isAbleToDelete() {
        return this.confirmDeleteText === 'delete'
      },

      enableDeleteButton() {
        return !this.isAbleToDelete || this.processOfExclusion
      }
    },

    watch: {
      informationForDeletion: {
        deep: true,
        handler() {
          this.confirmDeleteText = ''
          this.deleteDialogVisible = this.informationForDeletion.deleteDialogVisible
        }
      }
    }
  }
</script>
