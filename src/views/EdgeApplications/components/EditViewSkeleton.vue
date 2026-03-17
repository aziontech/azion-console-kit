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

  defineOptions({ name: 'edit-view-skeleton' })

  const tabWidths = ['5.5rem', '3.5rem', '6rem', '5rem', '6rem', '7.5rem', '5.5rem']

  const formConfig = [
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem', hasHelper: true }]
    },
    {
      titleWidth: '10rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        {
          type: 'radio',
          labelWidth: '8rem',
          count: 3,
          optionLabelWidth: '10rem',
          optionDescWidth: '20rem'
        },
        {
          type: 'input-row',
          inputs: [{ labelWidth: '6rem' }, { labelWidth: '7rem' }]
        }
      ]
    },
    {
      titleWidth: '7rem',
      descriptionWidths: ['100%', '90%', '60%'],
      fields: [{ type: 'module-cards', labelWidth: '10rem', count: 6 }]
    },
    {
      titleWidth: '8rem',
      descriptionWidths: ['100%', '95%', '85%'],
      fields: [{ type: 'switch-justified', labelWidth: '4rem', descriptionWidth: '90%' }]
    }
  ]
</script>
