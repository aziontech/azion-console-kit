<template>
  <PrimeDialog
    :blockScroll="true"
    visible
    modal
    class="max-w-xl"
  >
    <template #header>
      <h5 class="text-lg not-italic font-bold leading-5">Clone {{ entityName }}</h5>
    </template>

    <div class="flex flex-col sm:max-w-lg w-full gap-2">
      <FieldText
        :label="`To confirm, type a unique and easy-to-remember name for the new ${entityType}:`"
        :name="entityNameField"
        :value="entityNameValue"
        placeholder="Name"
      />
    </div>

    <template #closeicon>
      <PrimeButton
        outlined
        @click="closeDialog"
        icon="pi pi-times"
      />
    </template>

    <template #footer>
      <div class="flex gap-2 flex-col-reverse md:flex-row sm:justify-end w-full md:w-auto">
        <PrimeButton
          severity="primary"
          outlined
          label="Cancel"
          @click="closeDialog"
        ></PrimeButton>
        <PrimeButton
          severity="secondary"
          label="Clone"
          :disabled="loading"
          :icon="loadIconByLoadingState"
          @click="cloneEntity"
        ></PrimeButton>
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { useRouter } from 'vue-router'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    entityName: {
      type: String
    },
    entityType: {
      type: String
    },
    entityNameField: {
      type: String
    },
    cloneService: {
      type: Function
    }
  })

  const emit = defineEmits(['cloneCancel'])

  const toast = useToast()
  const loading = ref(false)
  const router = useRouter()

  const validationSchema = yup.object({
    entityNameField: yup.string().required().label('Name')
  })

  const initialValues = {
    entityNameField: ''
  }

  const { handleSubmit } = useForm({
    initialValues,
    validationSchema
  })

  const { value: entityNameValue } = useField('entityNameField')

  const showFeedback = (feedback = 'cloned successfully') => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: feedback
    })
  }

  const feedbackEntityCloned = (response) => {
    showFeedback(response.feedback)
    router.push({ path: response.urlToEditView })
  }

  const loadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const cloneEntity = handleSubmit(async () => {
    try {
      loading.value = true
      const response = await props.cloneService({
        entityName: entityNameValue.value
      })
      feedbackEntityCloned(response)
      emit('cloneCancel')
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loading.value = false
      closeDialog()
    }
  })

  const closeDialog = () => {
    emit('cloneCancel')
  }
</script>
