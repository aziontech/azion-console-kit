<template>
  <div>
    <Toast />
    <header class="border-neutral-200 border-b min-h-[82px] w-full flex items-center">
      <div class="p-4 w-full">
        <div class="flex flex-row flex-wrap items-center justify-left gap-4">
          <PrimeButton
            @click="handleCancel"
            text
            icon="pi pi-arrow-left"
          ></PrimeButton>
          <h1 class="text-4xl text-left font-normal text-gray-600">{{ pageTitle }}</h1>
        </div>
      </div>
    </header>

    <form
      @submit.prevent="handleSubmit"
      class="min-h- mt-4 p-4 max-w-screen-sm flex flex-col min-h-[calc(100vh-425px)] gap-4 lg:max-w-7xl mx-auto"
    >
      <div class="flex flex-col gap-4 sm:!w-full md:!w-1/2">
        <slot name="form" />
      </div>
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
  import Toast from 'primevue/toast'
  import PrimeButton from 'primevue/button'
  import ActionBarTemplate from '@/templates/action-bar-block'

  export default {
    name: 'edit-form-block',
    components: {
      Toast,
      PrimeButton,
      ActionBarTemplate
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
          this.$router.go('-1')
        }
      },
      async loadInitialData() {
        try {
          const { id } = this.$route.params
          this.isLoading = true
          const initialData = await this.loadService({ id })
          console.log(initialData)
          this.initialDataSetter(initialData)
        } catch (error) {
          this.$toast.add({
            closable: true,
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
            closable: true,
            severity: 'success',
            summary: 'edited successfully',
            life: 10000
          })
        } catch (error) {
          this.$toast.add({
            closable: true,
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
