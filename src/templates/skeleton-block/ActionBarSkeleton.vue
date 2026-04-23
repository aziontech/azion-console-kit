<template>
  <Teleport to="#action-bar">
    <div
      class="flex w-full gap-4 justify-end h-16 items-center border-t surface-border surface-section px-2 md:px-8"
    >
      <div class="flex w-full justify-end max-w-full 3xl:mx-auto">
        <div class="flex gap-3 self-stretch items-center justify-end w-full">
          <Skeleton
            width="5rem"
            height="2.5rem"
            borderRadius="6px"
          />
          <Skeleton
            width="5rem"
            height="2.5rem"
            borderRadius="6px"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'action-bar-skeleton' })
</script>
