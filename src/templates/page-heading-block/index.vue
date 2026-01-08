<script setup>
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import Breadcrumb from 'primevue/breadcrumb'
  import Skeleton from 'primevue/skeleton'
  import { computed, useSlots } from 'vue'
  import { useRouter } from 'vue-router'

  defineOptions({
    name: 'PageHeadingBlock'
  })

  const props = defineProps({
    pageTitle: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    isRightAlignment: {
      type: Boolean
    },
    tag: {
      type: Object
    },
    loadedItemLabel: {
      type: String,
      required: false
    },
    entityName: {
      type: String,
      required: false
    }
  })

  const router = useRouter()
  const slots = useSlots()
  const breadcrumbs = useBreadcrumbs()
  breadcrumbs.update(
    router.currentRoute.value.meta.breadCrumbs ?? [],
    router.currentRoute.value,
    props.entityName
  )

  const hasDefaultSlot = computed(() => {
    return !!slots.default
  })
</script>

<template>
  <div class="w-full md:h-16 flex md:flex-row flex-col gap-4 md:justify-between items-center">
    <div class="w-full md:w-auto flex flex-col">
      <Breadcrumb
        :model="breadcrumbs.items"
        class="overflow-auto w-full p-0"
        :pt="{
          label: { class: 'whitespace-nowrap text-[18px]' },
          menuItem: ({ props }) => ({
            'data-testid': `page-heading-block__breadcrumb__${props.item.label}`
          })
        }"
      >
        <template #item="{ item, props }">
          <Skeleton
            v-if="item.isLoading"
            width="8rem"
            height="1.125rem"
            class="bg-surface-200 dark:bg-surface-700"
          />
          <router-link
            v-else-if="item.to"
            :to="item.to"
            v-bind="props.action"
            :class="{
              'text-color-secondary': breadcrumbs.items.indexOf(item) === -1,
              'text-[var(--text-color-secondary)]':
                breadcrumbs.items.length > 1 && breadcrumbs.items.indexOf(item) === 0
            }"
          >
            {{ item.label }}
          </router-link>
          <span
            v-else
            class="text-[18px]"
          >
            {{ item.label }}
          </span>
        </template>
      </Breadcrumb>
      <span
        class="text-[var(--text-color-secondary)] text-sm font-normal leading-7 max-md:text-base px-0.5"
        v-if="props.description"
      >
        {{ props.description }}
      </span>
    </div>
    <div
      v-if="hasDefaultSlot"
      class="flex items-center gap-3 w-full md:w-auto md:justify-end"
    >
      <slot name="default"></slot>
    </div>
  </div>
</template>
<style scoped lang="scss">
  :deep(.p-breadcrumb .p-breadcrumb-list .p-menuitem:hover) {
    text-decoration: none !important;
  }
</style>
