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

  defineOptions({ name: 'edge-dns-edit-view-skeleton' })

  const tabWidths = ['7rem', '4.5rem']

  const formConfig = [
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem', hasHelper: true }]
    },
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%'],
      fields: [{ type: 'input', labelWidth: '7rem' }]
    },
    {
      titleWidth: '14rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        {
          type: 'input',
          labelWidth: '6rem',
          maxWidth: 'sm:max-w-lg'
        }
      ]
    },
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '90%', '70%'],
      fields: [{ type: 'switch', labelWidth: '8rem' }]
    },
    {
      titleWidth: '4rem',
      descriptionWidths: [],
      fields: [{ type: 'switch', labelWidth: '4rem' }]
    }
  ]
</script>
