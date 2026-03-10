<template>
  <ContentBlock>
    <template #heading>
      <BreadcrumbSkeleton :widths="['6rem', '10rem']" />
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

  defineOptions({ name: 'edge-node-edit-view-skeleton' })

  const tabWidths = ['7rem', '4.5rem']

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
        { type: 'input', labelWidth: '4.5rem', hasHelper: true },
        { type: 'input', labelWidth: '6.5rem', maxWidth: 'sm:max-w-3xl', hasHelper: true }
      ]
    },
    {
      titleWidth: '13rem',
      descriptionWidths: ['100%', '85%'],
      fields: [{ type: 'switch-justified', labelWidth: '8rem', descriptionWidth: '90%' }]
    }
  ]
</script>
