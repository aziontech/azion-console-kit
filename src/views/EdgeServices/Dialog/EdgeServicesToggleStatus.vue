<script setup>
  defineOptions({ name: 'edge-services-toggle-status' })
  import { ref, watch, computed } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  const emit = defineEmits(['update:visible', 'updateService'])

  const props = defineProps({
    serviceUpdate: {
      type: Function,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    },
    selectRow: {
      type: Object,
      required: true
    }
  })

  const toast = useToast()
  const visibleDialog = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })
  const title = ref('')
  const description = ref('')
  const statusTexts = {
    active: {
      titleStatus: 'Active',
      descriptionStatus: 'active'
    },
    inactive: {
      titleStatus: 'Inactive',
      descriptionStatus: 'inactive'
    }
  }

  const showToast = (severity, summary) => {
    if (!summary) return
    toast.add({
      closable: true,
      severity: severity,
      summary: summary
    })
  }

  const openDialog = (value) => {
    visibleDialog.value = value
  }

  const onCancel = () => {
    openDialog(false)
  }

  const onConfirm = async () => {
    if (!props.selectRow?.id) return
    try {
      const { id, active } = props.selectRow
      const feedback = await props.serviceUpdate({ edgeServiceID: id, active: !active })
      openDialog(false)
      showToast('success', feedback)
      emit('updateService')
    } catch (error) {
      openDialog(false)
      showToast('error', error)
    }
  }

  watch(
    () => props.visible,
    (value) => {
      if (!value) return

      const isActive = props.selectRow?.active
      const { titleStatus, descriptionStatus } = statusTexts[isActive ? 'inactive' : 'active']

      title.value = `${titleStatus} Edge Service`
      description.value = `Are you sure to ${descriptionStatus} the ${props.selectRow?.name}?`
    }
  )
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visibleDialog"
      :update:visible="openDialog"
      modal
      :pt="{
        root: { class: 'p-0 w-[576px]' },
        header: { class: 'flex p-5' },
        content: { class: 'p-5 h-full' },
        footer: { class: 'flex p-5 justify-end items-end border-t border-solid' }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">{{ title }}</h5>
      </template>
      <div class="flex items-center flex-1 text-color-secondary text-sm font-normal leading-5">
        {{ description }}?
      </div>
      <template #footer>
        <PrimeButton
          severity="primary"
          label="Cancel"
          outlined
          @click="onCancel"
        />
        <PrimeButton
          class="m-0"
          severity="Secondary"
          label="Confirm"
          @click="onConfirm"
        />
      </template>
    </PrimeDialog>
  </div>
</template>
