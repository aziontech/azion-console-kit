<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Header Container -->
  <header
    class="surface-section border-b surface-border min-h-[60px] items-center flex justify-between px-4 w-full"
  >
    <div
      class="flex w-full justify-between"
      v-if="isLogged"
    >
      <div class="flex gap-3 items-center">
        <PrimeButton
          @click="openSideBar"
          size="small"
          class="flex-none surface-border"
          text
          icon="pi pi-bars"
          style="height: 32px; width: 32px"
        />

        <Logo />
        <!-- Azion client -->
        <PrimeButton
          v-tooltip.bottom="'Switch Account'"
          class="ml-2 h-8 w-auto surface-border hidden md:flex gap-2 items-center"
          size="small"
          outlined
        >
          <i class="pi pi-building" />
          <span>Azion Client</span>
        </PrimeButton>
      </div>

      <!-- Search -->
      <span class="top-0 p-input-icon-left p-input-icon-right hidden lg:flex">
        <i class="pi pi-search" />
        <i class="!top-[35%]">
          <Tag
            class="not-italic border surface-border text-color-secondary cursor-pointer surface-100"
            value="⌘ + K"
            @click="openSearch"
          />
        </i>
        <InputText
          class="w-64"
          placeholder="Search..."
          :value="searchText"
          @click="openSearch"
          size="small"
        />
      </span>

      <!-- Right Buttons -->
      <div class="flex gap-2 items-center">
        <PrimeButton
          icon="pi pi-search"
          class="surface-border px-2 py-1 flex lg:hidden"
          @click="openSearch"
          style="height: 32px; width: 32px"
          outlined
        />

        <!-- Create Button Desktop -->
        <PrimeButton
          @click="showCreateModal"
          icon="pi pi-plus"
          label="Create"
          class="h-8 hidden sm:flex"
          size="small"
        />

        <!-- Create Button Mobile -->
        <PrimeButton
          @click="showCreateModal"
          icon="pi pi-plus"
          class="h-8 sm:hidden"
          size="small"
          style="height: 32px; width: 32px"
        />

        <!-- Help Button Desktop  -->

        <PrimeButton
          icon="pi pi-question-circle"
          size="small"
          label="Help"
          @click="showHelperCenter"
          outlined
          class="surface-border hidden sm:flex"
        />

        <!-- Create Button Mobile -->
        <PrimeButton
          icon="pi pi-question-circle"
          size="small"
          outlined
          class="sm:hidden"
          style="height: 32px; width: 32px"
          @click="showHelperCenterMobile"
        />

        <!-- Notification Button  -->
        <PrimeButton
          icon="pi pi-bell"
          style="border-color: var(--surface-border); padding-left: 7px; height: 32px; width: 32px"
          class="overflow-auto"
          badge="9"
          v-tooltip.bottom="'Notifications'"
          size="small"
          badgeClass="p-badge-danger"
          @click="toggleNotification"
          aria-haspopup="true"
          aria-controls="overlay_menu"
          outlined
          :pt="{
            root: { class: 'overflow-visible' },
            badge: { class: 'absolute right-[-4px] top-[-8px]' }
          }"
        />

        <Divider
          layout="vertical"
          class="px-0 mx-1 surface-border"
        />

        <!-- Avatar Desktop -->
        <Avatar
          @click="toggleProfile"
          label="U"
          class="cursor-pointer"
        />
      </div>
    </div>
    <Logo v-else />
  </header>
  <!-- help mobile sidebar -->
  <Sidebar
    v-model:visible="showHelp"
    position="bottom"
    headerContent="Help"
    :pt="{
      root: { class: '!h-[90%]' },
      header: { class: 'gap-60 text-color border-1 surface-border' }
    }"
  >
    <template #header>
      <div class="text-color">Help</div>
    </template>
    <div class="flex flex-col p-2">
      <!-- content -->
    </div>
  </Sidebar>
  <!-- Sidebar-->
  <Sidebar
    class="max-w-[280px]"
    v-model:visible="showSidebar"
    position="left"
  >
    <div class="flex flex-col p-2">
      <PrimeMenu
        :pt="{
          menuitem: { class: 'overflow-auto text-sm', style: 'border-radius: 6px !important' },
          content: { class: 'rounded-md' },
          submenuheader: { class: 'bg-transparent text-xs font-medium leading-none' },
          separator: { class: 'surface-border my-2' }
        }"
        class="bg-transparent w-full border-0 text-sm"
        :model="menuStructure"
      />
    </div>
  </Sidebar>

  <!-- Profile Menu -->
  <PrimeMenu
    :pt="{
      root: { class: '!w-[240px]' },
      submenuheader: { class: 'text-sm font-bold leading-none' },
      separator: { class: 'surface-border' }
    }"
    class=""
    ref="profile"
    :popup="true"
    :model="profileMenuItems"
  >
    <template #start>
      <div class="border-b surface-border flex flex-column gap-0.5 pb-1">
        <div class="flex flex-column align gap-0.5 px-3 pt-2 pb-1">
          <span class="font-bold">{{ accountData.name }}</span>
          <span class="text-xs text-color-secondary">ID: {{ accountData.id }}</span>
        </div>
        <PrimeButton
          label="Switch Account"
          text
          class="w-full rounded-none flex content-start text-left md:hidden"
        />
      </div>
    </template>

    <template #end>
      <div class="flex flex-row items-center px-3 pt-2.5 gap-2 pb-1.5">
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-bold leading-none">{{ accountData.full_name }}</span>
          <span class="text-xs text-color-secondary">{{ accountData.email }}</span>
        </div>
      </div>
      <PrimeButton
        class="w-full rounded-none flex content-start text-left"
        label="Your Settings"
        text
        @click="$router.push({ name: 'list-your-settings' })"
      />
      <PrimeButton
        class="w-full rounded-none flex content-start text-left"
        label="Personal Tokens"
        text
        @click="$router.push({ name: 'list-personal-tokens' })"
      />

      <!-- Theme Switch -->
      <div class="flex flex-row justify-between items-center align-middle px-3 py-1.5">
        <span>Theme</span>
        <Dropdown
          :modelValue="selectedTheme"
          @update:modelValue="selectTheme"
          optionValue="value"
          optionLabel="name"
          :options="themeOptions"
          :pt="{
            root: { class: 'w-auto py-0 h-8 items-center align-middle' },
            item: { class: 'text-sm' },
            input: { class: 'text-sm' }
          }"
        >
          <template #value="slotProps">
            <div
              v-if="slotProps.value"
              class="flex gap-2 align-items-center"
            >
              <i :class="slotProps.value.icon"></i>
              <div>{{ slotProps.value.name }}</div>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex gap-2 align-items-center">
              <i :class="slotProps.option.icon"></i>
              <div>{{ slotProps.option.name }}</div>
            </div>
          </template>
        </Dropdown>
      </div>
      <Divider class="surface-border p-1 m-0" />
      <PrimeButton
        class="w-full rounded-none flex content-start text-left text-red-600"
        label="Logout"
        icon="pi pi-sign-out"
        text
        @click="logout"
      />
    </template>
  </PrimeMenu>

  <!-- Quick Search -->
  <PrimeDialog
    v-model:visible="showSearch"
    modal
    position="center"
    :dismissableMask="true"
    :showHeader="false"
    :breakpoints="{ '641px': '90vw' }"
    :style="{ marginTop: '0px', width: '540px', maxHeight: '21rem' }"
    :pt="{
      root: { class: 'p-0 rounded-md' },
      content: { class: 'p-0 rounded-md' }
    }"
  >
    <div class="flex flex-col">
      <!-- Search Input -->
      <span class="sticky top-0 z-10 p-input-icon-left p-input-icon-right border-b surface-border">
        <i class="pi pi-search" />
        <i class="!top-[35%]">
          <Tag
            @click="closeSearch"
            class="not-italic border surface-border text-color-secondary surface-100 cursor-pointer"
            value="esc"
          />
        </i>
        <InputText
          placeholder="Search..."
          class="w-full rounded-none border-none h-12"
        />
      </span>
      <div class="m-2 surface-border border border-dashed flex items-center h-96">
        <p class="text-color-secondary text-center w-full">Slot</p>
      </div>
    </div>
  </PrimeDialog>

  <!-- Modal de create -->
  <PrimeDialog
    v-model:visible="showCreate"
    modal
    header="Create"
    position="center"
    :dismissableMask="true"
    :breakpoints="{ '641px': '90vw' }"
    :style="{ width: '65vw' }"
  >
    <!-- SLOT WIP -->
    <div class="m-2 surface-border border border-dashed flex items-center h-96">
      <p class="text-color-secondary text-center w-full">Slot</p>
    </div>
  </PrimeDialog>

  <!-- Notification Menu -->
  <PrimeMenu
    ref="menu"
    id="overlay_menu"
    :model="items"
    :popup="true"
  >
    <template #start>
      <!-- SLOT WIP -->
      <div class="m-2 surface-border border border-dashed flex items-center h-96">
        <p class="text-color-secondary text-center w-full">Slot</p>
      </div>
    </template>
  </PrimeMenu>
</template>

<script>
  // Imports
  import Avatar from 'primevue/avatar'
  import PrimeMenu from 'primevue/menu'
  import PrimeButton from 'primevue/button'
  import Sidebar from 'primevue/sidebar'
  import Divider from 'primevue/divider'
  import Logo from '@assets/svg/logo'
  import PrimeDialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import Tag from 'primevue/tag'
  import Dropdown from 'primevue/dropdown'
  import { useAccountStore } from '@/stores/account'
  import { mapActions, mapState } from 'pinia'

  export default {
    name: 'HeaderTemplate',

    emits: ['showSlideHelper', 'showSlideCenter'],

    components: {
      Avatar,
      PrimeMenu,
      Sidebar,
      Logo,
      PrimeButton,
      Divider,
      PrimeDialog,
      InputText,
      Dropdown,
      Tag
    },

    props: {
      helperVisible: {
        type: Boolean,
        default: false
      },
      isLogged: Boolean
    },

    data() {
      return {
        showHelp: false,
        showCreate: false,
        showSearch: false,
        showSidebar: false,
        showProfile: false,
        searchText: null,
        items: [],
        commandOptions: [
          {
            label: 'Recents',
            items: [
              { label: 'Import project', icon: 'pi pi-file-import' },
              { label: 'New project from template', icon: 'pi pi-plus-circle' },
              { label: 'New domains', icon: 'pi pi-plus-circle' },
              { label: 'Marketplace', icon: 'pi pi-shopping-cart' },
              { label: 'Toggle Dark Mode', icon: 'pi pi-moon' }
            ]
          },
          {
            label: 'Build',
            items: [
              { label: 'New Edge Application', icon: 'pi pi-plus-circle' },
              { label: 'New Edge Function', icon: 'pi pi-plus-circle' }
            ]
          },
          {
            label: 'Secure',
            items: [{ label: 'New Edge Firewall', icon: 'pi pi-plus-circle' }]
          },
          {
            label: 'Settings',
            items: [
              { label: 'Account Settings', icon: 'pi pi-cog' },
              { label: 'Your Settings', icon: 'pi pi-user' },
              { label: 'Users Management', icon: 'pi pi-users' },
              { label: 'Team Permissions', icon: 'pi pi-user-edit' },
              { label: 'Billing & Subscriptions', icon: 'pi pi-credit-card' },
              { label: 'Credentials', icon: 'pi pi-id-card' },
              { label: 'Activity History', icon: 'pi pi-history' },
              { label: 'Personal Tokens', icon: 'pi pi-key' }
            ]
          }
        ],
        menuStructure: [
          {
            label: 'Home',
            icon: 'pi pi-home',
            to: '/'
          },
          {
            label: 'Domains',
            icon: 'pi pi-globe',
            to: '/domains'
          },
          { separator: true },
          {
            label: 'BUILD',
            icon: 'pi pi-code',
            items: [
              {
                label: 'Edge Application',
                icon: 'pi pi-box',
                to: '/edge-applications'
              },
              {
                label: 'Variables',
                to: '/variables',
                icon: 'pi pi-sliders-h'
              },
              { separator: true }
            ]
          },
          {
            label: 'SECURE',
            icon: 'pi pi-lock',
            items: [
              {
                label: 'Intelligent DNS',
                to: '/intelligent-dns',
                icon: 'pi pi-share-alt'
              },
              {
                label: 'Edge Firewall',
                to: '/edge-firewall',
                icon: 'pi pi-lock'
              },
              { separator: true }
            ]
          },
          {
            label: 'DEPLOY',
            items: [
              {
                label: 'Edge Nodes',
                icon: 'pi pi-database',
                to: '/edge-node'
              },
              { separator: true }
            ]
          },
          {
            label: 'OBSERVE',
            items: [
              {
                label: 'Data Streaming',
                to: '/data-streaming',
                icon: 'pi pi-play'
              },
              {
                label: 'Edge Pulse',
                to: '/edge-pulse',
                icon: 'pi pi-chart-line'
              },

              { separator: true }
            ]
          },
          {
            label: 'EDGE LIBRARIES',
            items: [
              {
                label: 'Edge Functions',
                to: '/edge-functions',
                icon: 'pi pi-code'
              },
              {
                label: 'Edge Services',
                to: '/edge-services',
                icon: 'pi pi-bookmark'
              },
              {
                label: 'Digital Certificates',
                to: '/digital-certificates',
                icon: 'pi pi-verified'
              },
              {
                label: 'Network Lists',
                to: '/network-lists',
                icon: 'pi pi-globe'
              }
            ]
          }
        ],
        profileMenuItems: [
          {
            label: 'Organization Settings',
            items: [
              {
                label: 'Account Settings',
                to: '/account-settings'
              },
              {
                label: 'Users Management',
                to: '/users'
              },
              {
                label: 'Billing & Subscriptions',
                to: '/billing-subscriptions'
              },
              {
                label: 'Credentials',
                to: '/credentials'
              },
              {
                label: 'Activity History',
                to: '/activity-history'
              },
              {
                label: 'Teams Permissions',
                to: '/teams'
              },
              { separator: true }
            ]
          }
        ],
        themeOptions: [
          { name: 'Light', value: 'light', icon: 'pi pi-sun' },
          { name: 'Dark', value: 'dark', icon: 'pi pi-moon' },
          { name: 'System', value: 'system', icon: 'pi pi-desktop' }
        ]
      }
    },
    computed: {
      ...mapState(useAccountStore, ['accountData', 'currentTheme']),
      generateHomeBreadCrumb() {
        return {
          icon: 'pi pi-home',
          to: '/'
        }
      },

      generateBreadCrumbs() {
        return this.$router.currentRoute.value.meta.breadCrumbs ?? []
      },
      selectedTheme() {
        return this.themeOptions.find((option) => option.value === this.currentTheme)
      }
    },
    methods: {
      ...mapActions(useAccountStore, ['setTheme']),
      toggleProfile(event) {
        this.$refs.profile.toggle(event)
      },
      toggleNotification(event) {
        this.$refs.menu.toggle(event)
      },
      showCreateModal() {
        this.showCreate = true
      },
      openSideBar() {
        this.showSidebar = true
      },
      openSearch() {
        this.showSearch = true
      },
      closeSearch() {
        this.showSearch = false
      },
      showHelperCenter() {
        this.$emit('showSlideHelper', !this.helperVisible)
      },
      showHelperCenterMobile() {
        this.showHelp = true
      },
      logout() {
        window.location.href = '/logout'
      },
      selectTheme(theme) {
        this.setTheme(theme)
      }
    }
  }
</script>
