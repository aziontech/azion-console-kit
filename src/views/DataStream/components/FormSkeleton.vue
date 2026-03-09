<template>
  <FormSkeletonGenerator :config="formConfig" />
</template>

<script setup>
  import FormSkeletonGenerator from '@/templates/skeleton-block/FormSkeletonGenerator.vue'

  defineOptions({ name: 'data-stream-form-skeleton' })

  const formConfig = [
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem' }]
    },
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        { type: 'radio-cards', count: 2 },
        { type: 'input', labelWidth: '5rem', maxWidth: 'sm:max-w-xs' }
      ]
    },
    {
      titleWidth: '7rem',
      descriptionWidths: ['100%', '90%'],
      fields: [
        { type: 'textarea', labelWidth: '5rem' }
      ]
    },
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '75%'],
      fields: [
        { type: 'input', labelWidth: '8rem', maxWidth: 'sm:max-w-xs' },
        { type: 'input', labelWidth: '5rem' }
      ]
    },
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%', '75%'],
      fields: [{ type: 'switch', labelWidth: '4rem' }]
    }
  ]
</script>
