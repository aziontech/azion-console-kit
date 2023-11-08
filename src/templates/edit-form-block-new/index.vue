<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <PageHeadingBlock :pageTitle="pageTitle" />
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow px-8 flex flex-col gap-8 mb-5 max-sm:px-3 max-md:gap-6"
      :class="{ 'py-4': !hasTabs, 'pb-4': hasTabs }"
    >
      <slot name="form" />

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
      },
      hasTabs: {
        type: Boolean,
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
          const feedback = await this.editService(this.formData)
          this.$toast.add({
            closable: false,
            severity: 'success',
            summary: feedback ?? 'edited successfully',
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
