<template>
  <div class="w-full flex-col items-start inline-flex pt-4 px-8 max-md:px-3">
    <Breadcrumb
      :home="generateHomeBreadCrumb"
      :model="generateBreadCrumbs"
      class="-ml-1.5"
      :pt="{
        label: { class: 'whitespace-nowrap' },
        menuItem: ({ props }) => ({
          'data-testid': `page-heading-block-tabs__breadcrumb__${props.item.label}`
        })
      }"
    />
    <div class="flex flex-wrap w-full py-4 items-end justify-between">
      <div
        class="flex flex-col gap-3 w-full"
        v-if="pageTitle || description"
      >
        <div
          class="w-full text-[var(--text-color)] text-3xl font-medium leading-9 max-md:text-2xl"
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
        class="ml-auto w-full h-9 items-end flex justify-end"
      >
        <slot name="default"></slot>
      </div>
    </div>
    <slot name="tabs"></slot>
  </div>
</template>

<script>
  import Breadcrumb from 'primevue/breadcrumb'

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
      generateBreadCrumbs() {
        return this.$router.currentRoute.value.meta.breadCrumbs ?? []
      },
      hasDefaultSlot() {
        return !!this.$slots.default
      }
    }
  }
</script>
