<template>
  <div class="flex flex-col">
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
    <form class="w-full grow mt-4 p-4 max-w-screen-sm flex flex-col gap-4 lg:max-w-7xl mx-auto">
      <div class="flex flex-col gap-4 sm:!w-full md:!w-1/2">
        <slot name="form" />
      </div>
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
  import Toast from 'primevue/toast'
  import PrimeButton from 'primevue/button'
  import ActionBarTemplate from '@/templates/action-bar-block'
  export default {
    name: 'create-form-block-with-event',
    components: {
      Toast,
      PrimeButton,
      ActionBarTemplate
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
            closable: true,
            severity: 'success',
            summary: 'created successfully',
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
          this.isLoading = false
        }
      }
    }
  }
</script>
