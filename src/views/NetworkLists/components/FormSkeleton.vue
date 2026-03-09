<template>
  <FormSkeletonGenerator :config="formConfig" />
</template>

<script setup>
  import FormSkeletonGenerator from '@/templates/skeleton-block/FormSkeletonGenerator.vue'

  defineOptions({ name: 'network-lists-form-skeleton' })

  const formConfig = [
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem', hasHelper: true }]
    },
    {
      titleWidth: '12rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        { type: 'radio-cards', count: 3 },
        { type: 'input', labelWidth: '2.5rem', hasHelper: true }
      ]
    }
  ]
</script>
