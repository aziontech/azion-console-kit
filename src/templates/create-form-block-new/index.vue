<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <ToastBlock />

    <PageHeadingBlock :pageTitle="pageTitle" />
    <form class="w-full grow py-4 px-8 flex flex-col gap-8 mb-5">
      <slot name="form" />
      <slot name="raw-form" />
    </form>
    <ActionBarTemplate
      @cancel="handleCancel"
      @submit="validateAndSubmit"
      :loading="isLoading"
      :submitDisabled="!isValid"
    />
  </div>
</template>
<script>
  import ToastBlock from '@/templates/toast-block'
  import ActionBarTemplate from '@/templates/action-bar-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'create-form-block',
    components: {
      ToastBlock,
      ActionBarTemplate,
      PageHeadingBlock
    },
    data: () => ({
      isLoading: false
    }),
    props: {
      pageTitle: {
        type: String,
        required: true
      },
      createService: {
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
      cleanFormCallback: {
        type: Function,
        required: true
      }
    },
    methods: {
      handleCancel() {
        this.$router.go('-1')
      },

      async validateAndSubmit() {
        try {
          this.isLoading = true
          const feedback = await this.createService(this.formData)
          this.cleanFormCallback()
          this.$toast.add({
            closable: false,
            severity: 'success',
            summary: feedback ?? 'created successfully',
            life: 10000
          })
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
      }
    }
  }
</script>
