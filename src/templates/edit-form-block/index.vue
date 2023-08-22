<template>
  <Toast />
  <header class="border-neutral-200  border-b min-h-[82px] w-full flex items-center">
    <div class="p-4 w-full">
      <div class="flex flex-row flex-wrap items-center justify-left gap-4">
        <PrimeButton @click="handleCancel" text icon="pi pi-arrow-left"></PrimeButton>
        <h1 class="text-4xl text-left font-normal text-gray-600">{{ pageTitle }}</h1>
      </div>
    </div>
  </header>

  <form @submit.prevent="handleSubmit" class="mt-4 p-4 max-w-screen-sm flex flex-col gap-4  lg:max-w-7xl mx-auto">
    <div class="flex flex-col gap-4 sm:w-full md:w-1/2">
      <slot name="form" />
    </div>
    <div class="flex flex-wrap pb-4 gap-2 w-full justify-end mt-auto">
      <PrimeButton class="max-sm:w-full" type="button" severity="secondary" :label="'Cancel'" @click="handleCancel" />
      <PrimeButton :disabled="!isValid" class="max-sm:w-full" type="submit" :loading="isLoading" :label="'Submit'" />
    </div>
  </form>
</template>

<script>
import Toast from 'primevue/toast';
import PrimeButton from 'primevue/button';

export default {
  name: 'edit-form-block',
  components: {
    Toast,
    PrimeButton
  },
  data: () => ({
    isLoading: false,
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
    loadService:{
      type:Function,
      required:true
    },
    initialDataSetter:{
      type:Function,
      required:true,
    },
    isValid: {
      type: Boolean,
      required: true,
    },
    formData:{
      type: Object,
      required:true,
    }
  },
  async created(){
    await this.loadInitialData();
  },
  methods: {
    handleCancel() {
      this.$router.go('-1');
    },
    async loadInitialData(){
      try {
        const { id } = this.$route.params
        this.isLoading = true;
        const initialData = await this.loadService({id})
        this.initialDataSetter(initialData);
      } catch (error) {
        this.$toast.add({
          closable: true,
          severity: 'error',
          summary: error,
          life: 10000
        });
      } finally {
        this.isLoading = false;
      }

    },
    async handleSubmit() {
      try {
        this.isLoading = true;
        await this.editService(this.formData)
        this.$toast.add({
          closable: true,
          severity: 'success',
          summary: 'edited successfully',
          life: 10000,
        });
      } catch (error) {
        this.$toast.add({
          closable: true,
          severity: 'error',
          summary: error,
          life: 10000
        });
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 800);
      }
    }
  }
}
</script>
