<template>
  <FormSkeletonGenerator :config="formConfig" />
</template>

<script setup>
  import FormSkeletonGenerator from '@/templates/skeleton-block/FormSkeletonGenerator.vue'

  defineOptions({ name: 'error-responses-form-skeleton' })

  const formConfig = [
    {
      titleWidth: '9rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        {
          type: 'input-row',
          inputs: [
            { labelWidth: '7rem', maxWidth: 'sm:max-w-xs' },
            { labelWidth: '5rem', maxWidth: 'sm:max-w-xs' }
          ]
        },
        {
          type: 'input-row',
          inputs: [
            { labelWidth: '7rem', maxWidth: 'sm:max-w-xs' },
            { labelWidth: '5rem', maxWidth: 'sm:max-w-xs' }
          ]
        },
        {
          type: 'input-row',
          inputs: [
            { labelWidth: '7rem', maxWidth: 'sm:max-w-xs' },
            { labelWidth: '5rem', maxWidth: 'sm:max-w-xs' }
          ]
        },
        {
          type: 'input-row',
          inputs: [
            { labelWidth: '7rem', maxWidth: 'sm:max-w-xs' },
            { labelWidth: '5rem', maxWidth: 'sm:max-w-xs' }
          ]
        }
      ]
    },
    {
      titleWidth: '6rem',
      descriptionWidths: ['100%', '70%'],
      fields: [{ type: 'input', labelWidth: '4rem', maxWidth: 'sm:max-w-xs' }]
    }
  ]
</script>
