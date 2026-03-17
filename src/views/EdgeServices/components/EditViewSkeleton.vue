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

  defineOptions({ name: 'edge-service-edit-view-skeleton' })

  const tabWidths = ['7rem', '5.5rem']

  const formConfig = [
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%'],
      fields: [{ type: 'input', labelWidth: '3rem', hasHelper: true }]
    },
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '85%'],
      fields: [{ type: 'textarea', labelWidth: '5rem', inputHeight: '12rem' }]
    },
    {
      titleWidth: '3.5rem',
      descriptionWidths: [],
      fields: [{ type: 'switch', labelWidth: '3.5rem' }]
    }
  ]
</script>
