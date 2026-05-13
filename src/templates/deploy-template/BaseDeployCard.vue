<script setup>
  import Skeleton from 'primevue/skeleton'

  defineProps({
    title: {
      type: String,
      required: true
    },
    titleSize: {
      type: String,
      default: 'text-xl'
    },
    hideFooter: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    withoutBorder: {
      type: Boolean,
      default: false
    },
    backgroundcontent: {
      type: String,
      default: ''
    }
  })
</script>

<template>
  <div class="flex flex-col w-full md:max-w-3xl border bg-surface border-default rounded-md">
    <!-- Header -->
    <div
      class="min-h-14 px-4 sm:px-6 py-2 border-b border-default flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
    >
      <div
        class="text-color font-semibold leading-5 min-w-0 break-words"
        :class="titleSize"
      >
        <Skeleton
          v-if="loading"
          class="h-6 w-48"
        />
        <template v-else>
          {{ title }}
        </template>
      </div>
      <div
        v-if="$slots['header-right'] && !loading"
        class="text-sm font-normal text-color-secondary min-w-0 break-words"
      >
        <slot name="header-right" />
      </div>
    </div>

    <!-- Header Meta -->
    <div
      v-if="$slots['header-meta'] && !loading"
      class="px-4 sm:px-6 bg-[var(--surface-section)]"
      :class="{ 'border-b surface-border py-4': !withoutBorder, 'pt-4': withoutBorder }"
    >
      <slot name="header-meta" />
    </div>

    <!-- Content -->
    <div
      class="p-4 sm:p-6 flex flex-col gap-6"
      :class="backgroundcontent"
    >
      <template v-if="loading">
        <!-- Skeleton content placeholder -->
        <div class="flex flex-col gap-4">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-5/6" />
        </div>
        <div class="flex flex-col gap-4">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-2/3" />
        </div>
      </template>
      <slot
        v-else
        name="content"
      />
    </div>

    <!-- Footer -->
    <div
      v-if="!hideFooter && !loading"
      class="min-h-14 px-4 sm:px-6 py-2 border-t surface-border flex flex-col justify-center"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
