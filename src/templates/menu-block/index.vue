<template>
  <header style="
      background-color: var(--surface-section);
      border-bottom: 1px solid var(--surface-border);
    " class="items-center flex justify-between p-2">
    <div class="flex gap-3 items-center">
      <PrimeButton  @click="showSideBar" size="small" class="flex-none" text
        icon="pi pi-bars" />
      <Breadcrumb :model="generateBreadCrumbs" class="border: none; padding: none;">
        <template #separator>
          <svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.8125 -4.75L1.3125 19.9531H0.09375L9.59375 -4.75H10.8125Z" fill="#495057" />
          </svg>
        </template>
      </Breadcrumb>
    </div>
    <div class="flex gap-3 items-center">
      <PrimeButton  @click="showSearch = true" size="small" class="flex-none" text
        icon="pi pi-search" />
      <PrimeButton  size="small" class="flex-none" text icon="pi pi-moon" />
      <Avatar @click="showProfile = true" label="P" class="cursor-pointer" />
      <PrimeMenu ref="menu" id="overlay_menu" :model="[]" :popup="true" />
    </div>
  </header>

  <Sidebar :visible="sideBarVisible" position="left" @update:visible="val => showSideBar(val)" @hide="showSideBar(false)">
    <div class="flex flex-col p-4">
      <template  v-for="menuItem of menuItems" :key="menuItem.label">
        <p v-if="menuItem.sectionTitle" class="font-semibold my-4 text-md text-gray-400">{{menuItem.sectionTitle}}</p>
        <RouterLink
          @click="showSideBar(false)"
          :to="menuItem.to"
          class="mb-4 flex items-center"
          :activeClass="'text-orange-600'"
          >
          <i :class="`text-xl pi ${menuItem.icon} mr-3`" /> {{menuItem.label}}
        </RouterLink>

        <Divider v-if="menuItem.showDivider"/>
      </template>
      
     
    </div>
  </Sidebar>
</template>

<script>
import PrimeMenu from 'primevue/menu'
import PrimeButton from 'primevue/button'
import Breadcrumb from 'primevue/breadcrumb'
import Sidebar from 'primevue/sidebar'
import Avatar from 'primevue/avatar'
import Divider from 'primevue/Divider'


export default {
  name: 'menu-block',
  components: {
    Avatar,
    Divider,
    PrimeButton,
    Breadcrumb,
    PrimeMenu,
    Sidebar,
},
  data() {
    return {
      sideBarVisible: false,
      showSideBar: (state = true) => {
        this.sideBarVisible = state
      },
      menuItems:[
        {
          label:'Home',
          to:'/',
          icon:'pi-home'
        },
        {
          label:'Marketplace',
          to:'/marketplace',
          icon:'pi-shopping-cart'
        },
        {
          label:'Domains',
          to:'/domains',
          icon:'pi-globe',
          showDivider:true,
        },
        {
          sectionTitle:'BUILD',
          label:'Edge Application',
          to:'/edge-applications',
          icon:'pi-window-minimize',
        },
        {
          label:'Variables',
          to:'/variables',
          icon:'pi-sliders-h',
          showDivider:true,
        },
        {
          sectionTitle:'EDGE LIBRARIES',
          label:'Digital Certificates',
          to:'/digital-certificates',
          icon:'pi-verified',
          showDivider:true,
        }
      ]
    }
  },
  computed:{
    generateBreadCrumbs(){
      return this.$router.currentRoute.value.meta.breadCrumbs ?? [{label:'Home',to:'/'},]
    }
  }
}
</script>
