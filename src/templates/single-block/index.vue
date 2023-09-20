<template>
  <div>
    <Toast />
    <header class="border-neutral-200 border-b min-h-[82px] w-full flex items-center">
      <div class="p-4 w-full">
        <div class="flex flex-row flex-wrap items-center justify-left gap-4">
          <h1 class="text-4xl text-left font-normal text-gray-600">{{ pageTitle }}</h1>
        </div>
      </div>
    </header>

    <div
      class="mt-4 p-4 max-w-screen-sm flex flex-col gap-4 h-[calc(100%-250px)] lg:max-w-7xl mx-auto"
    >
      <slot name="content" />
    </div>
  </div>
</template>

<script>
  import Toast from 'primevue/toast'

  export default {
    name: 'single-block',
    components: {
      Toast
    },
    props: {
      pageTitle: {
        type: String,
        required: true
      }
    },
    methods: {
      copyCode() {
        console.log('copy')
      }
    }
  }
</script>
