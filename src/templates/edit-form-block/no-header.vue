<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow flex flex-col gap-8 mt-4"
    >
      <slot name="form" />

      <slot name="raw-form" />
    </form>
    <DialogUnsavedBlock
      :leavePage="leavePage"
      :blockRedirectUnsaved="hasModifications"
    />
  </div>
  <Teleport
    to="#action-bar"
    v-if="teleportLoad"
  >
    <ActionBarTemplate
      @cancel="handleCancel"
      @submit="handleSubmit"
      :loading="isLoading"
      :submitDisabled="!formMeta.valid"
    />
  </Teleport>
</template>

<script>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { TOAST_LIFE } from '@/utils/constants'

  export default {
    name: 'edit-form-block-no-header',
    components: {
      ActionBarTemplate,
      DialogUnsavedBlock
    },
    data: () => ({
      isLoading: false,
      blockViewRedirection: true,
      teleportLoad: false
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
      formData: {
        type: Object,
        required: true
      },
      formMeta: {
        type: Object,
        required: true
      },
      updatedRedirect: {
        type: String,
        required: true
      }
    },
    async created() {
      await this.loadInitialData()
    },
    mounted() {
      this.teleportLoad = true
    },
    methods: {
      showToast(severity, detail) {
        if (!detail) return

        const options = {
          closable: true,
          severity,
          summary: severity,
          detail
        }

        if (severity === 'success') {
          options.life = TOAST_LIFE
        }

        this.$toast.add(options)
      },
      leavePage(dialogUnsaved) {
        dialogUnsaved = false
        this.handleCancel()
        return dialogUnsaved
      },
      goBackToList() {
        if (this.updatedRedirect) {
          this.$router.push({ name: this.updatedRedirect })
          return
        }
        this.$router.go(-1)
      },
      handleCancel() {
        this.goBackToList()
      },
      async loadInitialData() {
        try {
          const { id } = this.$route.params
          this.isLoading = true
          const initialData = await this.loadService({ id })
          this.initialDataSetter(initialData)
        } catch (error) {
          this.showToast('error', error)
        } finally {
          this.isLoading = false
        }
      },
      async handleSubmit() {
        try {
          this.isLoading = true
          await this.editService(this.formData)
          this.showToast('success', 'edited successfully')
          this.blockViewRedirection = false
          this.goBackToList()
        } catch (error) {
          this.blockViewRedirection = true
          this.showToast('error', error)
        } finally {
          setTimeout(() => {
            this.isLoading = false
          }, 800)
        }
      }
    },
    computed: {
      hasModifications() {
        return this.formMeta.touched && this.blockViewRedirection
      }
    }
  }
</script>
