<template>
  <FormSkeletonGenerator :config="formConfig" />
</template>

<script setup>
  import FormSkeletonGenerator from '@/templates/skeleton-block/FormSkeletonGenerator.vue'

  defineOptions({ name: 'domains-form-skeleton' })

  const formConfig = [
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem' }]
    },
    {
      titleWidth: '10rem',
      descriptionWidths: ['100%', '85%'],
      fields: [{ type: 'radio-cards', count: 2 }]
    },
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '70%'],
      fields: [{ type: 'input', labelWidth: '5rem' }]
    },
    {
      titleWidth: '6rem',
      descriptionWidths: ['100%', '90%'],
      fields: [
        { type: 'input', labelWidth: '7rem' },
        { type: 'input', labelWidth: '6rem' },
        { type: 'switch', labelWidth: '10rem' },
        { type: 'textarea', labelWidth: '5rem' },
        { type: 'input', labelWidth: '10rem' }
      ]
    },
    {
      titleWidth: '14rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        { type: 'switch', labelWidth: '14rem' },
        { type: 'radio-cards', count: 2 },
        { type: 'input', labelWidth: '12rem' }
      ]
    },
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%', '75%'],
      fields: [{ type: 'switch', labelWidth: '4rem' }]
    }
  ]
</script>
