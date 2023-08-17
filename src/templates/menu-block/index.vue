<template>
  <header style="
      background-color: var(--surface-section);
      border-bottom: 1px solid var(--surface-border);
    " class="items-center flex justify-between p-2">
    <div class="flex gap-3 items-center">
      <PrimeButton  @click="showSideBar" size="small" class="flex-none" text
        icon="pi pi-bars" />
      <Breadcrumb :home="home" :model="generateBreadCrumbs" class="border: none; padding: none;">
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
      <PrimeMenu ref="menu" id="overlay_menu" :model="items" :popup="true" />
    </div>
  </header>

  <Sidebar :visible="sideBarVisible" position="left" @update:visible="val => showSideBar(val)" @hide="showSideBar(false)">
    <div class="flex flex-col p-4">
      <RouterLink to="/" class="mb-4 flex items-center">
        <i class="text-xl pi pi-home mr-3" /> Home
      </RouterLink>
      <RouterLink to="/" class="mb-4 flex items-center">
        <i class="text-xl pi pi-shopping-cart mr-3" /> Marketplace
      </RouterLink>
      <RouterLink to="/domains" class="mb-4 flex items-center">
        <i class="text-xl pi pi-globe mr-3" /> Domains
      </RouterLink>
      <Divider />
      <p class="font-semibold my-4 text-md text-gray-400">BUILD</p>
      <RouterLink to="/edge-applications" class="mb-4 flex items-center" @click="showSideBar(false)">
        <i class="text-xl pi pi-window-minimize mr-3" /> Edge Application
      </RouterLink>
      <RouterLink to="/variables" class="mb-4 flex items-center" @click="showSideBar(false)">
        <i class="text-xl pi pi-window-minimize mr-3" /> Variables
      </RouterLink>
      <Divider />
      <p class="font-semibold my-4 text-md text-gray-400">EDGE LIBRARIES</p>
      <RouterLink to="/" class="mb-4 flex items-center">
        <i class="text-xl pi pi-verified mr-3" /> Digital Certificates
      </RouterLink>
    </div>
  </Sidebar>
</template>

<script>
import PrimeMenu from 'primevue/menu'
import PrimeButton from 'primevue/button'
import Breadcrumb from 'primevue/breadcrumb'
import Sidebar from 'primevue/sidebar'
import Avatar from 'primevue/avatar'

export default {
  name: 'menu-block',
  components: {
    Avatar,
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
    }
  },
  computed:{
    generateBreadCrumbs(){
      return this.$router.currentRoute.value.meta.breadCrumbs ?? [{label:'Home',to:'/'},]
    }
  }
}
</script>
