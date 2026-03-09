<template>
  <FormSkeletonGenerator :config="formConfig" />
</template>

<script setup>
  import FormSkeletonGenerator from '@/templates/skeleton-block/FormSkeletonGenerator.vue'

  defineOptions({ name: 'users-form-skeleton' })

  const formConfig = [
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%', '80%'],
      fields: [
        { type: 'input', labelWidth: '5rem', hasHelper: true },
        { type: 'input', labelWidth: '5rem', hasHelper: true },
        {
          type: 'input-row',
          inputs: [
            { labelWidth: '5rem', maxWidth: 'sm:max-w-xs', hasHelper: true },
            { labelWidth: '5rem', maxWidth: 'sm:max-w-xs' }
          ]
        }
      ]
    },
    {
      titleWidth: '10rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        { type: 'input', labelWidth: '5rem', hasHelper: true },
        { type: 'input', labelWidth: '5rem', hasHelper: true }
      ]
    },
    {
      titleWidth: '9rem',
      descriptionWidths: ['100%', '90%'],
      fields: [
        { type: 'input', labelWidth: '5rem', maxWidth: 'w-full', hasHelper: true },
        { type: 'switch-justified', labelWidth: '7rem', descriptionWidth: '90%' },
        { type: 'switch-justified', labelWidth: '14rem', descriptionWidth: '90%' }
      ]
    },
    {
      titleWidth: '4rem',
      descriptionWidths: [],
      fields: [
        { type: 'switch-justified', labelWidth: '4rem' }
      ]
    }
  ]
</script>
