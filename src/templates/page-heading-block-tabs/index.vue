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
          class="text-[var(--text-color)] text-3xl font-medium font-['Roboto'] leading-9 hover:cursor-pointer"
          v-if="pageTitle"
        >
          {{ pageTitle }}
        </div>
        <div
          class="text-[var(--text-color-secondary)] text-lg font-normal font-['Roboto'] leading-7"
          v-if="description"
        >
          {{ description }}
        </div>
      </div>
      <div class="ml-auto w-full h-9 items-end flex justify-end">
        <slot></slot>
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
      }
    }
  }
</script>
