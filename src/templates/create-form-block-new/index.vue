<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <PageHeadingBlock :pageTitle="pageTitle" />
    <form
      class="w-full grow px-8 flex flex-col gap-8 mb-5 max-md:px-3"
      :class="{ 'py-4': !hasTabs, 'pb-4': hasTabs }"
    >
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
  import ActionBarTemplate from '@/templates/action-bar-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'create-form-block',
    components: {
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
      },
      hasTabs: {
        type: Boolean,
        required: false
      }
    },
    methods: {
      handleCancel() {
        this.$router.go(-1)
      },
      goBackToList() {
        this.$router.go(-1)
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
          this.goBackToList()
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
