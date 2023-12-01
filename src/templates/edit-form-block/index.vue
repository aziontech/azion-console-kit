<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <PageHeadingBlock :pageTitle="pageTitle" />

    <form
      @submit.prevent="handleSubmit"
      class="w-full grow mt-4 p-4 max-w-screen-sm flex flex-col gap-4 lg:max-w-7xl mx-auto"
    >
      <div class="flex flex-col gap-4 sm:!w-full md:!w-1/2">
        <slot name="form" />
      </div>

      <slot name="raw-form" />
    </form>
    <ActionBarTemplate
      @cancel="handleCancel"
      @submit="handleSubmit"
      :loading="isLoading"
      :submitDisabled="!isValid"
    />
  </div>
</template>

<script>
  import ActionBarTemplate from '@/templates/action-bar-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'edit-form-block',
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
      }
    },
    async created() {
      await this.loadInitialData()
    },
    methods: {
      handleCancel() {
        if (this.backURL) {
          this.$router.push({ path: this.backURL })
        } else {
          this.$router.go(-1)
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
            closable: true,
            severity: 'error',
            summary: error
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
            closable: true,
            severity: 'success',
            summary: 'edited successfully'
          })
          this.goBackToList()
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
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
