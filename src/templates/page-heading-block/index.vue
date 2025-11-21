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
    }
  })

  const router = useRouter()
  const slots = useSlots()
  const breadcrumbs = useBreadcrumbs()
  breadcrumbs.update(router.currentRoute.value.meta.breadCrumbs ?? [], router.currentRoute.value)

  const hasDefaultSlot = computed(() => {
    return !!slots.default
  })
</script>

<template>
  <div class="w-full flex justify-between items-center">
    <div>
      <Breadcrumb
        :model="breadcrumbs.items"
        class="overflow-auto w-full"
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

      <div
        class="flex flex-col justify-start gap-3 max-md:w-full"
        v-if="props.pageTitle || props.description"
      >
        <div
          class="text-[var(--text-color-secondary)] text-xs font-normal leading-7 max-md:text-base"
          v-if="props.description"
        >
          {{ props.description }}
        </div>
      </div>
    </div>
    <div
      v-if="hasDefaultSlot"
      class="items-center flex justify-end max-md:w-full"
    >
      <slot name="default"></slot>
    </div>
  </div>
</template>
