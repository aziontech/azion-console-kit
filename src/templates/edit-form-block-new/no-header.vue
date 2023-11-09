<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow py-4 px-8 flex flex-col gap-8 mb-5 max-sm:px-3"
    >
      <slot name="form" />

      <slot name="raw-form" />
    </form>
    <DialogUnsavedBlock
      v-model:visible="dialogUnsaved"
      @leavePage="leavePage"
      @keepEditing="keepEditing"
    />
    <ActionBarTemplate
      @cancel="handleCancel"
      @submit="handleSubmit"
      :loading="isLoading"
      :submitDisabled="!isValid"
    />
  </div>
</template>

<script>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import ActionBarTemplate from '@/templates/action-bar-block'

  export default {
    name: 'edit-form-block-no-header',
    components: {
      ActionBarTemplate,
      DialogUnsavedBlock
    },
    data: () => ({
      isLoading: false,
      dialogUnsaved: false
    }),
    props: {
      editService: {
        type: Function,
        required: true
      },
      loadService: {
        type: Function,
        required: true
      },
      initialDataSetter: {
        type: Function,
        required: true
      },
      isValid: {
        type: Boolean,
        required: true
      },
      formData: {
        type: Object,
        required: true
      },
      backURL: {
        type: String,
        required: false
      },
      formMeta: {
        type: Object,
        required: true
      }
    },
    async created() {
      await this.loadInitialData()
    },
    methods: {
      leavePage() {
        this.dialogUnsaved = false
        this.handleCancel()
      },
      keepEditing() {
        this.dialogUnsaved = false
      },
      openDialogUnsaved() {
        if (this.formMeta.touched) {
          this.dialogUnsaved = true
          return
        }
        this.handleCancel()
      },
      handleCancel() {
        if (this.backURL) {
          this.$router.push({ path: this.backURL })
        } else {
          this.$router.go('-1')
        }
      },
      goBackToList() {
        this.$router.go(-1)
      },
      async loadInitialData() {
        try {
          const { id } = this.$route.params
          this.isLoading = true
          const initialData = await this.loadService({ id })
          this.initialDataSetter(initialData)
        } catch (error) {
          this.$toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          this.isLoading = false
        }
      },
      async handleSubmit() {
        try {
          this.isLoading = true
          await this.editService(this.formData)
          this.$toast.add({
            closable: false,
            severity: 'success',
            summary: 'edited successfully',
            life: 10000
          })
          this.goBackToList()
        } catch (error) {
          this.$toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          setTimeout(() => {
            this.isLoading = false
          }, 800)
        }
      }
    }
  }
</script>
