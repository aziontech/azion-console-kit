<template>
  <PrimeDialog
    v-model:visible="deleteDialogVisible"
    modal
    :header="`Delete ${informationForDeletion.title}`"
    class="w-[40vw]"
  >
    <div class="flex flex-col gap-5">
      <div>
        <Message
          class="w-100"
          severity="warn"
          :closable="false"
          >Warning: This action is not reversible. Please be certain.</Message
        >

        <p class="pt-3.5 text-color-secondary">
          This Edge Application will be deleted along, Device Groups, Origins settings, Cache
          Settings and Rule Sets.
        </p>
      </div>

      <Divider class="-ml-5 w-[calc(100%_+_40px)]" />

      <div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="confirm-input"
            class="font-semibold text-sm"
            >To confirm, type “delete” in the box below:</label
          >
          <InputText
            id="confirm-input"
            type="text"
            v-model="confirmation"
            :class="{ 'p-invalid': errors.confirmation }"
            v-tooltip.top="{ value: errors.confirmation, showDelay: 200 }"
          />
          <small
            v-if="errors.confirmation"
            class="p-error text-xs font-normal leading-tight"
            >{{ errors.confirmation }}</small
          >
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 flex-col-reverse lg:flex-row justify-end">
        <PrimeButton
          severity="primary"
          outlined
          label="Cancel"
          class="m-0"
          @click="cancelDialog()"
        ></PrimeButton>
        <PrimeButton
          severity="danger"
          label="Delete"
          icon-pos="right"
          @click="removeItem()"
          :icon="calculateLoadIconByLoadingState"
          :disabled="isDisabled"
        ></PrimeButton>
      </div>
    </template>
  </PrimeDialog>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import Message from 'primevue/message'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    props: {
      informationForDeletion: {
        type: Object,
        required: true
      }
    },
    components: {
      PrimeButton,
      PrimeDialog,
      Message,
      InputText,
      Divider
    },
    data() {
      return {
        loading: false,
        deleteDialogVisible: false
      }
    },
    setup() {
      const validationSchema = yup.object({
        confirmation: yup.string().equals(['delete'], '').required('This is a required field')
      })

      const { errors, meta, values, resetForm } = useForm({
        validationSchema,
        initialValues: {
          confirmation: ''
        }
      })

      const { value: confirmation } = useField('confirmation')

      return {
        confirmation,
        errors,
        meta,
        values,
        resetForm
      }
    },
    methods: {
      async removeItem() {
        this.loading = true
        let toastConfig = {
          closable: false,
          severity: 'success',
          summary: '',
          life: 10000
        }

        try {
          const feedback = await this.informationForDeletion.deleteService(
            this.informationForDeletion.selectedID
          )
          toastConfig.summary = feedback ?? 'Deleted successfully'
          this.$emit('successfullyDeleted')
          this.resetForm()
        } catch (error) {
          toastConfig = {
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          }
        } finally {
          this.deleteDialogVisible = false
          this.$toast.add(toastConfig)
          this.loading = false
        }
      },

      cancelDialog() {
        this.deleteDialogVisible = false
      }
    },

    computed: {
      calculateLoadIconByLoadingState() {
        return this.loading ? 'pi pi-spin pi-spinner' : ''
      },
      isDisabled() {
        return !this.meta.valid || this.loading
      }
    },
    watch: {
      informationForDeletion: {
        deep: true,
        handler() {
          this.deleteDialogVisible = this.informationForDeletion.deleteDialogVisible
        }
      }
    }
  }
</script>
