<template>
  <div class="w-full flex-col justify-center items-start inline-flex">
    <Breadcrumb
      :home="generateHomeBreadCrumb"
      :model="breadcrumbs.items"
      class="-ml-1.5 overflow-auto w-full"
      :pt="{
        label: { class: 'whitespace-nowrap' }
      }"
    />
    <div class="flex w-full py-4 items-center justify-between flex-wrap gap-3">
      <div
        class="flex flex-col gap-3 max-md:w-full"
        v-if="pageTitle || description"
      >
        <div
          class="text-[var(--text-color)] text-3xl font-medium leading-9 max-md:text-2xl"
          v-if="pageTitle"
        >
          {{ pageTitle }}
        </div>
        <div
          class="text-[var(--text-color-secondary)] text-lg font-normal leading-7 max-md:text-base"
          v-if="description"
        >
          {{ description }}
        </div>
      </div>
      <div
        v-if="hasDefaultSlot"
        class="ml-auto items-end flex justify-end max-md:w-full"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import Breadcrumb from 'primevue/breadcrumb'
  import { useRouter } from 'vue-router'

  export default {
    name: 'PageHeadingBlock',
    components: {
      Breadcrumb
    },
    data() {
      return {
        activeTab: 0,
        home: {
          label: 'Home',
          to: '/'
        },
        tabItems: [
          {
            label: 'Home',
            icon: 'pi pi-fw pi-home'
          },
          {
            label: 'Calendar',
            icon: 'pi pi-fw pi-calendar'
          },
          {
            label: 'Edit',
            icon: 'pi pi-fw pi-pencil'
          },
          {
            label: 'Documentation',
            icon: 'pi pi-fw pi-file'
          },
          {
            label: 'Settings',
            icon: 'pi pi-fw pi-cog'
          }
        ]
      }
    },
    props: {
      pageTitle: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: false
      }
    },
    computed: {
      generateHomeBreadCrumb() {
        return {
          label: 'Home',
          to: '/'
        }
      },
      hasDefaultSlot() {
        return !!this.$slots.default
      }
    },
    setup() {
      const $router = useRouter()
      const breadcrumbs = useBreadcrumbs()
      breadcrumbs.update($router.currentRoute.value.meta.breadCrumbs ?? [])

      return { breadcrumbs }
    }
  }
</script>
