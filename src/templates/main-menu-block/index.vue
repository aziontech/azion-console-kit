<template>
  <header
    style="background-color: var(--surface-section); border-bottom: 1px solid var(--surface-border)"
    class="items-center flex justify-between p-2"
  >
    <div class="flex gap-3 items-center flex-grow">
      <PrimeButton
        @click="showSideBar"
        size="small"
        class="flex-none"
        text
        icon="pi pi-bars"
      />

      <AzionLogo />

      <Breadcrumb
        :home="generateHomeBreadCrumb"
        :model="generateBreadCrumbs"
        class="!p-2 border-none"
      >
        <template #separator>
          <svg
            width="11"
            height="14"
            viewBox="0 0 11 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.8125 -4.75L1.3125 19.9531H0.09375L9.59375 -4.75H10.8125Z"
              fill="#495057"
            />
          </svg>
        </template>
      </Breadcrumb>
    </div>
    <div class="flex gap-3 items-center">
      <PrimeButton
        @click="showSearch = true"
        size="small"
        class="flex-none"
        text
        icon="pi pi-search"
      />
      <PrimeButton
        size="small"
        class="flex-none"
        text
        icon="pi pi-moon"
      />
      <Avatar
        @click="showProfile = true"
        label="P"
        class="cursor-pointer"
      />
      <PrimeMenu
        ref="menu"
        id="overlay_menu"
        :model="[]"
        :popup="true"
      />
    </div>
  </header>

  <Sidebar
    :visible="sideBarVisible"
    position="left"
    @update:visible="(val) => showSideBar(val)"
    @hide="showSideBar(false)"
  >
    <div class="flex flex-col p-4">
      <template
        v-for="menuItem of menuItems"
        :key="menuItem.label"
      >
        <p
          v-if="menuItem.sectionTitle"
          class="font-semibold my-4 text-md text-gray-400"
        >
          {{ menuItem.sectionTitle }}
        </p>
        <RouterLink
          @click="showSideBar(false)"
          :to="menuItem.to"
          class="mb-4 flex items-center"
          :activeClass="'text-orange-600'"
        >
          <i :class="`text-xl pi ${menuItem.icon} mr-3`" /> {{ menuItem.label }}
        </RouterLink>

        <Divider v-if="menuItem.showDivider" />
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
  import Divider from 'primevue/divider'
  import AzionLogo from '../../assets/svg/azion'

  export default {
    name: 'menu-block',
    components: {
      Avatar,
      Divider,
      PrimeButton,
      Breadcrumb,
      PrimeMenu,
      Sidebar,
      AzionLogo
    },
    data() {
      return {
        sideBarVisible: false,
        showSideBar: (state = true) => {
          this.sideBarVisible = state
        },
        menuItems: [
          {
            label: 'Home',
            to: '/',
            icon: 'pi-home'
          },
          {
            label: 'Domains',
            to: '/domains',
            icon: 'pi-globe',
            showDivider: true
          },
          {
            sectionTitle: 'BUILD',
            label: 'Edge Application',
            to: '/edge-applications',
            icon: 'pi-window-minimize'
          },
          {
            label: 'Variables',
            to: '/variables',
            icon: 'pi-sliders-h',
            showDivider: true
          },
          {
            sectionTitle: 'SECURE',
            label: 'Intelligent DNS',
            to: '/intelligent-dns',
            icon: 'pi-share-alt'
          },
          {
            label: 'Edge Firewall',
            to: '/edge-firewall',
            icon: 'pi-lock',
            showDivider: true
          },
          {
            sectionTitle: 'OBSERVE',
            label: 'Data Streaming',
            to: '/data-streaming',
            icon: 'pi-play'
          },
          {
            sectionTitle: 'EDGE LIBRARIES',
            label: 'Edge Functions',
            to: '/edge-functions',
            icon: 'pi-code'
          },
          {
            label: 'Edge Services',
            to: '/edge-services',
            icon: 'pi-bookmark'
          },
          {
            label: 'Digital Certificates',
            to: '/digital-certificates',
            icon: 'pi-verified'
          },
          {
            label: 'Network Lists',
            to: '/network-lists',
            icon: 'pi-globe',
            showDivider: true
          }
        ]
      }
    },
    computed: {
      generateHomeBreadCrumb() {
        return {
          icon: 'pi pi-home',
          to: '/'
        }
      },
      generateBreadCrumbs() {
        return this.$router.currentRoute.value.meta.breadCrumbs ?? []
      }
    }
  }
</script>
