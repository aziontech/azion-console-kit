<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <ToastBlock />
    <PageHeadingBlock :pageTitle="pageTitle" />
    <form class="w-full grow mt-4 p-4 max-w-screen-sm flex flex-col gap-4 lg:max-w-7xl mx-auto">
      <div class="flex flex-col gap-4 sm:!w-full md:!w-1/2">
        <slot name="form" />
      </div>
    </form>
    <ActionBarBlockGoBack v-if="isRequestSuccess" />
    <ActionBarTemplate
      @cancel="handleCancel"
      @submit="validateAndSubmit"
      :loading="isLoading"
      :submitDisabled="!isValid"
      v-else
    />
  </div>
</template>
<script>
  import ActionBarTemplate from '@/templates/action-bar-block'
  import ActionBarBlockGoBack from '@/templates/action-bar-block/go-back'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ToastBlock from '@/templates/toast-block'

  export default {
    name: 'create-form-block-with-event',
    components: {
      ToastBlock,
      ActionBarTemplate,
      ActionBarBlockGoBack,
      PageHeadingBlock
    },
    emits: ['on-response'],
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
      },
      isRequestSuccess: {
        type: Boolean
      }
    },
    methods: {
      handleCancel() {
        this.$router.go('-1')
      },
      async validateAndSubmit() {
        try {
          this.isLoading = true
          const response = await this.createService(this.formData)
          this.$emit('on-response', response)
          this.$toast.add({
            closable: false,
            severity: 'success',
            summary: 'created successfully',
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
