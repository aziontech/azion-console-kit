<template>
  <ContentBlock>
    <template #heading>
      <BreadcrumbSkeleton />
    </template>
    <template #content>
      <div
        class="h-full w-full"
        data-testid="deployment-edit-view-skeleton"
      >
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

  defineOptions({ name: 'deployment-edit-view-skeleton' })

  const tabWidths = ['5rem', '4.5rem', '8rem']

  const formConfig = [
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%', '60%'],
      fields: [
        { type: 'input', labelWidth: '3rem', hasHelper: true },
        { type: 'textarea', labelWidth: '5rem' }
      ]
    },
    {
      titleWidth: '8rem',
      descriptionWidths: ['100%', '90%'],
      fields: [
        {
          type: 'radio',
          labelWidth: '7rem',
          count: 2,
          optionLabelWidth: '5rem',
          optionDescWidth: '22rem'
        },
        {
          type: 'radio',
          labelWidth: '12rem',
          count: 2,
          optionLabelWidth: '8rem',
          optionDescWidth: '24rem'
        }
      ]
    },
    {
      titleWidth: '9rem',
      descriptionWidths: ['100%', '80%'],
      fields: [
        { type: 'switch', labelWidth: '4rem', descriptionWidth: '22rem' },
        { type: 'switch', labelWidth: '8rem', descriptionWidth: '24rem' }
      ]
    }
  ]
</script>
