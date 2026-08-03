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

  defineOptions({ name: 'digital-certificates-edit-view-skeleton' })

  const tabWidths = ['7rem', '9rem']

  const formConfig = [
    {
      titleWidth: '6rem',
      descriptionWidths: ['100%', '80%'],
      fields: [
        { type: 'input', labelWidth: '3rem', hasHelper: true },
        { type: 'input', labelWidth: '4rem', hasHelper: true },
        { type: 'switch', labelWidth: '5rem', descriptionWidth: '18rem' }
      ]
    }
  ]
</script>
