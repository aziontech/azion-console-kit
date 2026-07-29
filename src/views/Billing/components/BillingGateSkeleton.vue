<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Billing"
        description="View and manage invoices, payments, and subscription details."
        :isRightAlignment="true"
      />
    </template>
    <template #content>
      <div class="w-full flex flex-col min-[1100px]:flex-row gap-6 mt-4 items-stretch">
        <BillingCardSkeleton />
        <BillingCardSkeleton />
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import BillingCardSkeleton from './BillingCardSkeleton.vue'

  defineOptions({ name: 'billing-gate-skeleton' })
</script>
