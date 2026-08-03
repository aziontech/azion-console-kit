<template>
  <ContentBlock>
    <template #heading>
      <BreadcrumbSkeleton />
    </template>
    <template #content>
      <div class="h-full w-full">
        <TabsSkeleton :tabWidths="tabWidths" />
        <FormSkeletonGenerator :config="formConfig" />
      </div>
    </template>
  </ContentBlock>
  <ActionBarSkeleton />
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import BreadcrumbSkeleton from '@/templates/skeleton-block/BreadcrumbSkeleton.vue'
  import TabsSkeleton from '@/templates/skeleton-block/TabsSkeleton.vue'
  import FormSkeletonGenerator from '@/templates/skeleton-block/FormSkeletonGenerator.vue'
  import ActionBarSkeleton from '@/templates/skeleton-block/ActionBarSkeleton.vue'

  defineOptions({ name: 'workload-edit-view-skeleton' })

  const tabWidths = ['7rem']

  const formConfig = [
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem', hasHelper: true }]
    },
    {
      titleWidth: '8rem',
      descriptionWidths: ['100%', '85%'],
      fields: [{ type: 'radio-cards', count: 2 }]
    },
    {
      titleWidth: '6rem',
      descriptionWidths: ['100%', '90%', '70%'],
      fields: [
        { type: 'input', labelWidth: '9rem', hasHelper: true },
        {
          type: 'input-row',
          inputs: [{ labelWidth: '5rem' }, { labelWidth: '4rem' }]
        },
        { type: 'switch', labelWidth: '8rem', descriptionWidth: '16rem' },
        { type: 'switch', labelWidth: '16rem', descriptionWidth: '24rem' }
      ]
    },
    {
      titleWidth: '12rem',
      descriptionWidths: ['100%', '90%', '75%'],
      fields: [
        { type: 'input', labelWidth: '6rem', maxWidth: 'sm:max-w-xs' },
        { type: 'input', labelWidth: '6rem', maxWidth: 'sm:max-w-xs' },
        { type: 'input', labelWidth: '6rem', maxWidth: 'sm:max-w-xs' }
      ]
    },
    {
      titleWidth: '10rem',
      descriptionWidths: ['100%', '90%', '80%'],
      fields: [
        { type: 'input', labelWidth: '5rem', maxWidth: 'sm:max-w-xs' },
        { type: 'switch', labelWidth: '8rem', descriptionWidth: '22rem' },
        { type: 'switch', labelWidth: '8rem', descriptionWidth: '18rem' }
      ]
    },
    {
      titleWidth: '17rem',
      descriptionWidths: ['100%', '85%'],
      fields: [{ type: 'switch', labelWidth: '12rem' }]
    },
    {
      titleWidth: '4rem',
      descriptionWidths: [],
      fields: [{ type: 'switch', labelWidth: '4rem' }]
    }
  ]
</script>
