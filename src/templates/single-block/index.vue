<template>
  <div>
    <PageHeadingBlock :pageTitle="pageTitle" />

    <div
      class="mt-4 p-4 max-w-screen-sm flex flex-col gap-4 h-[calc(100%-250px)] lg:max-w-7xl mx-auto"
    >
      <slot name="content" />
    </div>
  </div>
</template>

<script>
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'single-block',
    props: {
      pageTitle: {
        type: String,
        required: true
      }
    },
    components: {
      PageHeadingBlock
    }
  }
</script>
