<template>
  <div class="flex justify-center items-center w-full">
    <div
      class="surface-section rounded-md border surface-border p-6"
      style="width: 672px; height: 536px"
    >
      <div class="flex flex-col gap-2 mb-6">
        <Skeleton class="h-7 w-44" />
      </div>
      <div class="flex gap-2">
        <Skeleton class="h-36 w-72" />
        <Skeleton class="h-36 w-72 flex-1" />
      </div>

      <Skeleton class="h-14 w-full mt-8" />

      <div class="flex gap-2 mt-8">
        <div class="flex flex-col gap-2 w-full">
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-14 w-full" />
        </div>
        <div class="flex flex-col gap-2 w-full">
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-14 w-full" />
        </div>
      </div>
      <Skeleton class="h-14 w-full mt-4" />
    </div>
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'
</script>
