<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <PageHeadingBlock :pageTitle="pageTitle" />
    <form
      class="w-full grow px-8 flex flex-col gap-8 mb-5 max-md:px-3 max-md:gap-6"
      :class="{ 'py-4': !hasTabs, 'pb-4': hasTabs }"
    >
      <slot name="form" />
      <slot name="raw-form" />
    </form>
    <ActionBarBlockGoBack v-if="buttonBackList" />
    <ActionBarTemplate
      @cancel="navigateBack"
      @submit="validateAndSubmit"
      :loading="isLoading"
      :submitDisabled="!isValid"
      v-else
    />
  </div>
</template>
<script>
  import ActionBarTemplate from '@/templates/action-bar-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockGoBack from '@/templates/action-bar-block/go-back'

  export default {
    name: 'create-form-block',
    components: {
      ActionBarTemplate,
      PageHeadingBlock,
      ActionBarBlockGoBack
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
        default: () => ({})
      },
      hasTabs: {
        type: Boolean,
        required: false
      },
      buttonBackList: {
        type: Boolean,
        default: false
      },
      callback: {
        type: Boolean,
        default: true
      },
      disabledFeedback: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      navigateBack() {
        this.$router.go(-1)
      },
      showToast(severity, summary, life = 10000) {
        if (!summary) return
        this.$toast.add({
          closable: false,
          severity: severity,
          summary: summary,
          life: life
        })
      },
      showFeedback(feedback = 'created successfully') {
        if (!this.disabledFeedback) {
          this.showToast('success', feedback)
        }
      },
      handleSuccess(feedback) {
        this.cleanFormCallback()
        this.$emit('on-response', feedback)
        this.showFeedback(feedback)
        if (this.callback) this.navigateBack()
      },
      async validateAndSubmit() {
        try {
          this.isLoading = true
          const feedback = await this.createService(this.formData)
          this.handleSuccess(feedback)
        } catch (error) {
          this.showToast('error', error)
        } finally {
          this.isLoading = false
        }
      }
    }
  }
</script>
