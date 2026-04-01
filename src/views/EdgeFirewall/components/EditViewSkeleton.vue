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

  defineOptions({ name: 'edge-firewall-edit-view-skeleton' })

  const tabWidths = ['7rem', '9rem', '6.5rem']

  const formConfig = [
    {
      titleWidth: '4rem',
      descriptionWidths: ['100%', '80%'],
      fields: [{ type: 'input', labelWidth: '3rem', hasHelper: true }]
    },
    {
      titleWidth: '5rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        {
          type: 'module-cards',
          count: 4
        }
      ]
    },
    {
      titleWidth: '6.5rem',
      descriptionWidths: ['100%', '85%'],
      fields: [
        {
          type: 'switch',
          labelWidth: '3.5rem',
          descriptionWidth: '90%'
        }
      ]
    },
    {
      titleWidth: '3.5rem',
      descriptionWidths: [],
      fields: [{ type: 'switch', labelWidth: '3.5rem' }]
    }
  ]
</script>
