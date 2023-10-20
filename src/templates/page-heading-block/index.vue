<template>
  <div class="w-full flex-col justify-center items-start inline-flex pt-4 px-8">
    <Breadcrumb
      :home="generateHomeBreadCrumb"
      :model="generateBreadCrumbs"
    />
    <div class="flex w-full py-4 items-end justify-between">
      <div
        class="flex flex-col gap-3 w-full"
        v-if="pageTitle || description"
      >
        <div
          class="text-[var(--text-color)] text-3xl font-medium leading-9"
          v-if="pageTitle"
        >
          {{ pageTitle }}
        </div>
        <div
          class="text-[var(--text-color-secondary)] text-lg font-normal leading-7"
          v-if="description"
        >
          {{ description }}
        </div>
      </div>
      <div class="ml-auto w-full h-9 items-end flex justify-end">
        <slot></slot>
      </div>
    </div>
    <TabMenu
      v-model:activeIndex="activeTab"
      @tab-change="handleTabChange"
      v-if="navigationItems"
      :model="navigationItems"
    />
  </div>
</template>

<script>
  import Breadcrumb from 'primevue/breadcrumb'
  import TabMenu from 'primevue/tabmenu'

  export default {
    name: 'PageHeadingBlock',
    components: {
      Breadcrumb,
      TabMenu
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
      },
      navigationItems: {
        type: Array,
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
      }
    },
    methods: {
      handleTabChange() {
        const tabChange = new CustomEvent('tabChange', { detail: { tab: this.activeTab } })
        document.dispatchEvent(tabChange)
      }
    }
  }
</script>
