<template>
  <div class="grid grid-col-1 p-10">
    <div class="flex items-center justify-center gap-4">
      <PrimeButton
        size="small"
        severity="success"
        label="Success Toasts"
        @click="triggerToasts('success')"
      />
      <PrimeButton
        size="small"
        severity="warning"
        label="Warn Toasts"
        @click="triggerToasts('warn')"
      />
      <PrimeButton
        size="small"
        severity="danger"
        label="Error Toasts"
        @click="triggerToasts('error')"
      />
      <PrimeButton
        size="small"
        severity="info"
        label="Info Toasts"
        @click="triggerToasts('info')"
      />
      <LabelBlock
        label="Label"
        isRequired
      />
    </div>
  </div>
</template>

<script setup>
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'
  import LabelBlock from '@/templates/label-block'
  const toast = useToast()

  const triggerToasts = (type) => {
    const toastOptions = {
      severity: type,
      summary: 'Title (limited to 100 characters)',
      detail:
        'Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam consectetur leo tortor (limited to 125 characters).'
    }

    const actions = {
      primary: { callback: () => console.log('Primary Action'), label: 'Primary' },
      secondary: { callback: () => console.log('Secondary Action'), label: 'Secondary' },
      link: { callback: () => console.log('Link Action'), label: 'Link' }
    }

    // only title
    toast.add({ ...toastOptions, detail: undefined })

    // title and description
    toast.add(toastOptions)

    // actions
    toast.add({
      ...toastOptions,
      action: { primary: actions.primary, secondary: actions.secondary }
    })

    // link
    toast.add({ ...toastOptions, action: { link: actions.link } })

    // with custom life
    toast.add({ ...toastOptions, life: 0 })
  }
</script>
