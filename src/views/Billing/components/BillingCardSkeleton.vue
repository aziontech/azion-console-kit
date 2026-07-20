<template>
  <div class="border border-default rounded-md flex flex-col w-full min-[1100px]:w-1/2">
    <div
      class="rounded-t-md bg-[var(--table-header-cell-bg)] dark:bg-surface-700 border-b border-default px-4 py-1.5 h-11 flex items-center justify-between overflow-visible"
    >
      <Skeleton
        width="10rem"
        height="1.25rem"
      />
    </div>

    <div class="flex-1 bg-[var(--card-content-bg)]">
      <div class="flex flex-col gap-4 px-6 py-4">
        <Skeleton
          width="10rem"
          height="1.25rem"
        />
        <div
          v-for="i in rows"
          :key="i"
          class="flex h-5 items-center justify-between text-[13px] leading-5"
        >
          <Skeleton
            width="8rem"
            height="1rem"
          />
          <Skeleton
            width="6rem"
            height="1rem"
          />
        </div>
      </div>
    </div>

    <div
      class="border-t border-default bg-[var(--table-header-cell-bg)] flex items-center justify-center px-4 py-3 rounded-b-md"
    >
      <Skeleton
        width="80%"
        height="1rem"
      />
    </div>
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'billing-card-skeleton' })

  defineProps({
    rows: { type: Number, default: 4 }
  })
</script>
