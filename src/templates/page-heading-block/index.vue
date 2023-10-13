<template>
        <div class="w-full flex flex-col justify-center items-start inline-flex pt-4 px-8">
            <Breadcrumb :home="generateHomeBreadCrumb" :model="generateBreadCrumbs" class="!p-2 border-none" />
            <div class="flex w-full py-4 items-end">
                <div class="flex flex-col gap-3" v-if="pageTitle || description">
                    <div @click="handleCancel" class="text-gray-600 text-3xl font-medium font-['Roboto'] leading-9 hover:cursor-pointer" v-if="pageTitle">{{pageTitle}}</div>
                    <div class="text-stone-500 text-lg font-normal font-['Roboto'] leading-7" v-if="description">{{ description }}</div>
                </div>
                <div class="ml-auto w-40 h-9 items-end flex">
                    <slot></slot>
                </div>
            </div>
            <TabMenu v-model:activeIndex="activeTab" @tab-change="handleTabChange" v-if="navigationItems" :model="navigationItems"/>
        </div>
</template>

<script>

import Breadcrumb from 'primevue/breadcrumb';
import TabMenu from 'primevue/tabmenu';

// Export my assets and components
export default {
  name: 'PageHeadingTemplate',
  components: {
//    PrimeButton,
    Breadcrumb,
    TabMenu,
  },
  data() {
    return {
        activeTab: 0,
        home : {
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
        ],
    };
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
      },
    },
  computed: {
    generateHomeBreadCrumb() {
      return {
        label: 'Home',
        to: '/',
      }
    },
    generateBreadCrumbs() {
      return this.$router.currentRoute.value.meta.breadCrumbs ?? []
    }
  },
  methods: {
    handleCancel() {
        this.$router.go('-1')
    },
    handleTabChange() {
      this.$emit('tabChange', this.activeTab);
    },
  },
};
</script>
