<template>
  <div class="flex flex-col min-h-[calc(100vh-300px)]">
    <form class="w-full grow flex flex-col gap-8 max-md:gap-6">
      <slot name="form" />
      <slot name="raw-form" />
    </form>
    <DialogUnsavedBlock :blockRedirectUnsaved="hasModifications" />
    <Teleport
      v-if="teleportLoad"
      to="#action-bar"
    >
      <ActionBarBlockGoBack
        :goBack="goBack"
        v-if="buttonBackList"
      />
      <ActionBarTemplate
        @cancel="navigateBack"
        @submit="validateAndSubmit"
        :loading="isLoading"
        :submitDisabled="!formMeta.valid"
        v-else
      />
    </Teleport>
  </div>
</template>
<script>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import ActionBarTemplate from '@/templates/action-bar-block'
  import ActionBarBlockGoBack from '@/templates/action-bar-block/go-back'

  export default {
    name: 'create-form-block',
    components: {
      ActionBarTemplate,
      ActionBarBlockGoBack,
      DialogUnsavedBlock
    },
    emits: ['on-response'],
    data: () => ({
      isLoading: false,
      blockViewRedirection: true,
      teleportLoad: false
    }),
    props: {
      goBack: {
        type: Function,
        required: false
      },
      pageTitle: {
        type: String,
        required: true
      },
      createService: {
        type: Function,
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
      },
      formMeta: {
        type: Object,
        required: true
      },
      blockRedirect: {
        type: Boolean,
        required: false,
        default: true
      }
    },
    mounted() {
      this.teleportLoad = true
    },
    methods: {
      navigateBack() {
        this.$router.go(-1)
      },
      redirectToUrl(path) {
        this.$router.push({ path })
      },
      showToast(severity, summary, life = 10000) {
        if (!summary) return
        this.$toast.add({
          closable: true,
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
      handleSuccess(response) {
        this.cleanFormCallback()
        this.$emit('on-response', response)
        this.showFeedback(response.feedback)
        if (this.callback) this.redirectToUrl(response.urlToEditView)
      },
      async validateAndSubmit() {
        try {
          this.isLoading = true
          const response = await this.createService(this.formData)
          this.handleSuccess(response)
        } catch (error) {
          this.showToast('error', error)
          this.blockViewRedirection = true
        } finally {
          this.isLoading = false
        }
      }
    },
    computed: {
      hasModifications() {
        return this.formMeta.touched && this.blockViewRedirection && this.blockRedirect
      }
    }
  }
</script>
