<script setup>
  import { inject, computed } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  defineOptions({ name: 'edge-services-toggle-status' })

  const dialogRef = inject('dialogRef')
  const params = dialogRef.value.data

  const toast = useToast()
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

  const onConfirm = async () => {
    if (!params.selectRow?.id) return
    try {
      const { id, active } = params.selectRow
      const feedback = await params.service({ id, active: !active })
      showToast('success', feedback)
      dialogRef.value.close({ updated: true })
    } catch (error) {
      showToast('error', error)
      closeDialog()
    }
  }

  const closeDialog = () => {
    dialogRef.value.close({ updated: false })
  }

  const getStatusTexts = (isActive) => {
    return isActive ? statusTexts.inactive : statusTexts.active
  }

  const getTitleContent = computed(() => {
    const isActive = params.selectRow?.active
    const { titleStatus } = getStatusTexts(isActive)

    return `${titleStatus} Edge Service`
  })

  const getDescriptionContent = computed(() => {
    const isActive = params.selectRow?.active
    const { descriptionStatus } = getStatusTexts(isActive)

    return `Are you sure to ${descriptionStatus} the ${params.selectRow?.name}?`
  })
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      modal
      visible
      :pt="{
        root: { class: 'p-0 w-[576px]' },
        header: { class: 'flex p-5' },
        content: { class: 'p-5 h-full' },
        footer: { class: 'flex p-5 justify-end items-end border-t border-solid' }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">{{ getTitleContent }}</h5>
      </template>
      <div class="flex items-center flex-1 text-color-secondary text-sm font-normal leading-5">
        {{ getDescriptionContent }}
      </div>
      <template #closeicon>
        <PrimeButton
          outlined
          @click="closeDialog()"
          icon="pi pi-times"
        />
      </template>
      <template #footer>
        <PrimeButton
          severity="primary"
          label="Cancel"
          outlined
          @click="closeDialog()"
        />
        <PrimeButton
          class="m-0"
          severity="secondary"
          label="Confirm"
          @click="onConfirm"
        />
      </template>
    </PrimeDialog>
  </div>
</template>
