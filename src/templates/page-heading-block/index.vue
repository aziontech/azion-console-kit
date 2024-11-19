<script setup>
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import Breadcrumb from 'primevue/breadcrumb'
  import PrimeTag from 'primevue/tag'
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
  breadcrumbs.update(router.currentRoute.value.meta.breadCrumbs ?? [])

  const generateHomeBreadCrumb = computed(() => {
    return {
      label: 'Home',
      to: '/'
    }
  })
  const hasDefaultSlot = computed(() => {
    return !!slots.default
  })

  const hasContent = computed(() => props.pageTitle || props.description || hasDefaultSlot.value)
</script>

<template>
  <div class="w-full flex-col justify-center items-start inline-flex">
    <Breadcrumb
      :home="generateHomeBreadCrumb"
      :model="breadcrumbs.items"
      class="-ml-1.5 overflow-auto w-full"
      :pt="{
        label: { class: 'whitespace-nowrap' },
        menuItem: ({ props }) => ({
          'data-testid': `page-heading-block__breadcrumb__${props.item.label}`
        })
      }"
    />
    <div
      class="flex w-full py-4 items-center flex-wrap gap-3"
      :class="{ 'justify-between': !props.isRightAlignment }"
      v-if="hasContent"
    >
      <div
        class="flex flex-col gap-3 max-md:w-full"
        v-if="props.pageTitle || props.description"
      >
        <div
          :data-testid="`page_title_${props.pageTitle}`"
          class="text-[var(--text-color)] text-3xl font-medium leading-9 max-md:text-2xl"
          v-if="props.pageTitle"
          :class="{ 'flex gap-3 align-items-center': props.tag }"
        >
          {{ props.pageTitle
          }}<PrimeTag
            v-if="props.tag"
            class="h-max"
            v-bind="props.tag"
            v-tooltip.bottom="props.tag?.tooltip"
          />
        </div>
        <div
          class="text-[var(--text-color-secondary)] text-lg font-normal leading-7 max-md:text-base"
          v-if="props.description"
        >
          {{ props.description }}
        </div>
      </div>
      <div
        v-if="hasDefaultSlot"
        class="items-end flex justify-end max-md:w-full"
        :class="{ 'ml-auto': !props.isRightAlignment }"
      >
        <slot name="default"></slot>
      </div>
    </div>
  </div>
</template>
