<template>
  <PrimeDialog
    v-model:visible="deleteDialogVisible"
    modal
    :header="`Delete ${informationForDeletion.title}`"
    :draggable="false"
    class="md:max-w-[680px]"
    :pt="{
      content: { class: 'p-4 md:p-8' },
      header: { class: 'p-4 md:p-8' },
      footer: { class: 'p-4 md:p-8 flex' }
    }"
    @keyup.enter="removeItem()"
  >
    <div class="flex flex-col gap-5">
      <div>
        <Message
          class="w-100"
          severity="warn"
          :closable="false"
          >Once confirmed, this action can't be reversed.</Message
        >

        <p class="pt-3.5 text-color-secondary">
          This {{ informationForDeletion.title }} will be deleted along with any associated settings
          or instances. Check Help Center for more details.
        </p>
      </div>

      <Divider class="-ml-4 w-[calc(100%+2rem)] md:-ml-8 w-[calc(100%+4rem) md:w-[calc(100%+4rem)]"/>

      <div>
        <div class="flex flex-col w-full gap-2">
          <label
            for="confirm-input"
            class="font-semibold text-sm"
            >Type “delete” to confirm:</label
          >
          <InputText
            id="confirm-input"
            type="text"
            autofocus
            v-model="confirmation"
            :class="{ 'p-invalid': errors.confirmation }"
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
      <div class=" justify-end w-full flex gap-4">
        <PrimeButton
          severity="primary"
          outlined
          class="flex-none md:flex"
          label="Cancel"
          @click="cancelDialog()"
        ></PrimeButton>
        <PrimeButton
          class="w-full md:w-auto"
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

<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import Message from 'primevue/message'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { computed, ref, watch } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()

  const validationSchema = yup.object({
    confirmation: yup.string().equals(['delete'], '').required('This is a required field')
  })

  const { errors, meta, resetForm } = useForm({
    validationSchema,
    initialValues: {
      confirmation: ''
    }
  })

  const { value: confirmation } = useField('confirmation')

  const emit = defineEmits(['successfullyDeleted'])
  const props = defineProps({
    informationForDeletion: {
      type: Object,
      required: true
    }
  })

  const loading = ref(false)
  const deleteDialogVisible = ref(false)

  const removeItem = async () => {
    if (!meta.value.valid) return
    loading.value = true
    let toastConfig = {
      closable: true,
      severity: 'success',
      summary: ''
    }

    try {
      const feedback = await props.informationForDeletion.deleteService(
        props.informationForDeletion.selectedID,
        props.informationForDeletion.selectedItemData
      )
      toastConfig.summary = feedback ?? 'Deleted successfully!'
      emit('successfullyDeleted')
      resetForm()
    } catch (error) {
      toastConfig = {
        closable: true,
        severity: 'error',
        summary: error
      }
    } finally {
      deleteDialogVisible.value = false
      toast.add(toastConfig)
      loading.value = false
    }
  }

  const cancelDialog = () => {
    deleteDialogVisible.value = false
    resetForm()
  }

  const calculateLoadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const isDisabled = computed(() => {
    return !meta.value.valid || loading.value
  })

  watch(
    () => props.informationForDeletion,
    (value) => {
      if (value) {
        resetForm()
        deleteDialogVisible.value = props.informationForDeletion.deleteDialogVisible
      }
    },
    { deep: true }
  )
</script>
