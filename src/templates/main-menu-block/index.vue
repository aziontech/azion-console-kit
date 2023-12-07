<template>
  <!-- Header Container -->
  <header
    class="p-3 bg-header text-white border-b surface-border items-center flex justify-between md:px-8 md:py-3 w-full fixed top-0 z-10 h-[56px]"
    @keyup.esc="closeSideBar"
  >
    <div
      class="flex w-full justify-between"
      v-if="isLogged"
    >
      <div class="flex gap-3 items-center">
        <PrimeButton
          @click="openSideBar"
          size="small"
          class="text-white flex-none border-header"
          icon="pi pi-bars"
          style="height: 32px; width: 32px"
          :pt="{
            label: { class: 'text-white hover:bg-header-button-hover' },
            icon: { class: 'text-white' }
          }"
          :class="{
            'bg-header-button-enabled': showSidebar,
            'bg-header hover:bg-header-button-hover': !showSidebar
          }"
          v-tooltip.bottom="{ value: 'Menu', showDelay: 200 }"
        />

        <Logo
          class="max-md:hidden cursor-pointer"
          @click="$router.push('/')"
        />
        <MobileLogo
          class="md:hidden cursor-pointer"
          @click="this.$router.push('/')"
        />

        <!-- Azion client -->
        <SwitchAccountBlock
          class="ml-2"
          v-if="hasAccessToSwitchAccount"
          v-model:showSwitchAccount="openSwitchAccount"
          :accessMenu="profileMenuSwitchAccount"
          :account="user"
          :listTypeAccountService="listTypeAccountService"
          :accountHandler="accountHandler"
        />
      </div>

      <!-- Search -->
      <span
        class="top-0 p-input-icon-left p-input-icon-right hidden lg:flex md:absolute md:my-3 md:ml-[calc(50%-10rem)]"
      >
        <i class="pi pi-search text-white" />
        <i class="!top-[32%]">
          <span
            @click="openSearch"
            class="rounded-md py-1 px-2 text-xs font-semibold bg-header not-italic border border-header text-header cursor-pointer"
            >⌘ K</span
          >
        </i>
        <InputText
          class="w-64 bg-header-input border-header placeholder:text-header text-header hover:border-header-hover"
          placeholder="Search"
          :value="searchText"
          @click="openSearch"
          size="small"
        />
      </span>

      <!-- Right Buttons -->
      <div class="flex gap-2 items-center">
        <PrimeButton
          icon="pi pi-search"
          class="bg-header hover:bg-header-button-hover !text-white px-2 py-1 flex lg:hidden border-header"
          :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
          }"
          @click="openSearch"
          style="height: 32px; width: 32px"
          v-tooltip.bottom="{ value: 'Search', showDelay: 200 }"
        />

        <!-- Create Button Desktop -->
        <PrimeButton
          @click="createModalStore.toggle()"
          icon="pi pi-plus"
          label="Create"
          class="!text-white h-8 hidden md:flex border-header"
          size="small"
          :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
          }"
          :class="{
            'bg-header hover:bg-header-button-hover': !createModalStore.isOpen,
            'bg-header-button-enabled': createModalStore.isOpen
          }"
        />

        <!-- Create Button Mobile -->
        <PrimeButton
          @click="createModalStore.toggle()"
          icon="pi pi-plus"
          class="h-8 md:hidden text-white border-header"
          size="small"
          style="height: 32px; width: 32px"
          :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
          }"
          :class="{
            'bg-header hover:bg-header-button-hover': !createModalStore.isOpen,
            'bg-header-button-enabled': createModalStore.isOpen
          }"
          v-tooltip.bottom="{ value: 'Create', showDelay: 200 }"
        />

        <!-- Help Button Desktop  -->
        <PrimeButton
          icon="pi pi-question-circle"
          size="small"
          label="Help"
          @click="helpCenterStore.toggle()"
          :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
          }"
          class="hidden md:flex !text-white border-header"
          :class="{
            'bg-header hover:bg-header-button-hover': !helpCenterStore.isOpen,
            'bg-header-button-enabled': helpCenterStore.isOpen
          }"
        />

        <!-- Help Button Mobile -->
        <PrimeButton
          icon="pi pi-question-circle"
          size="small"
          class="md:hidden text-white border-header"
          style="height: 32px; width: 32px"
          @click="helpCenterStore.toggle()"
          :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
          }"
          :class="{
            'bg-header hover:bg-header-button-hover': !helpCenterStore.isOpen,
            'bg-header-button-enabled': helpCenterStore.isOpen
          }"
          v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
        />

        <!-- Notification Button  -->
        <PrimeButton
          icon="pi pi-bell"
          style="padding-left: 7px; height: 32px; width: 32px"
          class="overflow-auto text-white border-header bg-header hover:bg-header-button-hover"
          badge="9"
          v-tooltip.bottom="{ value: 'Notifications', showDelay: 200 }"
          size="small"
          badgeClass="p-badge-danger"
          @click="toggleNotification"
          aria-haspopup="true"
          aria-controls="overlay_menu"
          :pt="{
            root: { class: 'overflow-visible' },
            label: { class: 'text-white' },
            icon: { class: 'text-white' },
            badge: { class: 'absolute right-[-4px] top-[-8px]' }
          }"
        />

        <!-- Profile Mobile-->
        <Avatar
          @click="toggleProfileMobile"
          label="U"
          class="transition-all hover:border-orange-500 hover:bg-header-button-hover cursor-pointer md:hidden text-avatar text-avatar bg-header-avatar"
          v-tooltip.bottom="{ value: 'Account', showDelay: 200 }"
        />
        <!-- Profile Desktop -->
        <Avatar
          @click="toggleProfile"
          label="U"
          class="transition-all hover:border-orange-500 hover:bg-header-button-hover hidden md:flex cursor-pointer bg-header-avatar"
          v-tooltip.bottom="{ value: 'Account', showDelay: 200 }"
        />
      </div>
    </div>
    <Logo
      class="cursor-pointer"
      @click="$router.push({ name: 'login' })"
      v-else
    />
  </header>
  <!-- Mobile Profile Menu  -->
  <Sidebar
    @click="toggleProfileMobile"
    v-model:visible="showProfile"
    position="bottom"
    :show-close-icon="false"
    :pt="{
      root: { class: 'h-auto flex' },
      header: { class: 'hidden' },
      mask: { class: 'flex' }
    }"
    class="md:p-3"
  >
    <PrimeMenu
      :pt="{
        root: { class: 'p-0 md:p-3 w-full border-none bg-transparent' },
        submenuheader: { class: 'text-base font-medium leading-none' },
        action: { class: '' }
      }"
      class="w-full border-none bg-transparent md:p-3"
      ref="profile"
      :model="profileMenuItems"
    >
      <template #start>
        <div class="flex flex-column px-2.5 h-14 justify-center">
          <div class="flex flex-column align gap-1">
            <span class="text-sm font-medium">{{ user.name }}</span>
            <div class="flex gap-2">
              <span class="text-xs">ID: {{ user.id }}</span>
              <span class="text-xs">Client ID: {{ user.client_id }}</span>
            </div>
          </div>
        </div>
      </template>

      <template #end>
        <PrimeMenu
          class="w-full border-none bg-transparent"
          :pt="{
            root: {
              class: 'p-0 w-full border-none bg-transparent'
            },
            submenuheader: { class: 'text-base font-medium leading-none mt-5' }
          }"
          :model="profileMenuSettings"
        >
          <template #start>
            <div class="flex flex-row items-center">
              <div class="flex flex-col gap-1 px-2 py-2.5">
                <span class="text-sm font-medium leading-none">{{ user.full_name }}</span>
                <span class="text-xs">{{ user.email }}</span>
              </div>
            </div>
          </template>
        </PrimeMenu>
        <!-- Theme Switch -->
        <div class="flex flex-row justify-between items-center align-middle px-2 py-1.5">
          <span>Theme</span>
          <Dropdown
            :modelValue="selectedTheme"
            @update:modelValue="selectTheme"
            @click.stop
            optionValue="value"
            optionLabel="name"
            :options="themeOptions"
            :autoOptionFocus="false"
            :pt="{
              root: { class: 'w-auto py-0 h-8 items-center align-middle surface-section' },
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
        <Divider class="-ml-2 w-[calc(100%+1rem)] mt-2.5 mb-2" />
        <PrimeButton
          class="w-full rounded-md flex content-start text-left"
          :pt="{
            label: {
              class: 'font-normal'
            },
            root: {
              class: 'rounded-md hover:surface-200'
            }
          }"
          label="Logout"
          icon="pi pi-sign-out"
          text
          @click="logout"
        />
      </template>
    </PrimeMenu>
  </Sidebar>

  <!-- Sidebar-->
  <Sidebar
    class="max-w-72 z-5"
    style="border-right: 1px solid var(--surface-border)"
    v-model:visible="showSidebar"
    position="left"
    :pt="{
      header: { class: 'hidden' },
      root: { class: 'shadow-none' },
      mask: { class: 'top-[56px]' },
      content: { class: 'px-0 md:px-[1rem] pt-0' }
    }"
  >
    <PrimeMenu
      :pt="{
        submenuheader: { class: 'text-base font-medium leading-none mt-5 md:px-4' },
        action: { class: 'md:px-4' }
      }"
      class="w-full border-none pb-20 px-0 md:px-2 pt-1 md:pt-4 bg-transparent"
      :model="menuStructure"
    >
      <template #item="{ item, label, props }">
        <a
          v-bind="props.action"
          @click="redirect(item.to)"
        >
          <span v-bind="props.icon" />
          <span v-bind="props.label">{{ label }}</span>
          <Tag
            severity="info"
            v-if="item.tag"
            :value="item.tag"
            class="ml-2"
          />
        </a>
      </template>
    </PrimeMenu>
  </Sidebar>

  <!-- Profile Menu -->
  <PrimeMenu
    :pt="{
      root: { class: '!w-[280px] pb-2 pt-0 invisible md:visible' },
      menu: { class: '' }
    }"
    ref="profile"
    :popup="true"
    :model="profileMenuItems"
  >
    <template #start>
      <div class="flex flex-column mt-2 px-2.5 py-3">
        <div class="flex flex-column align gap-1">
          <span class="text-sm font-medium">{{ user.name }}</span>
          <div class="flex gap-2">
            <span class="text-xs">ID: {{ user.id }}</span>
            <span class="text-xs">Client ID: {{ user.client_id }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #end>
      <Divider class="-ml-2 w-[calc(100%+1rem)] mt-3 mb-2" />
      <div class="flex flex-row items-center">
        <div class="flex flex-col gap-1 px-2 py-2.5">
          <span class="text-sm font-medium leading-none">{{ user.full_name }}</span>
          <span class="text-xs">{{ user.email }}</span>
        </div>
      </div>
      <PrimeMenu
        class="w-full border-none bg-transparent"
        :pt="{
          root: {
            class: 'p-0 w-full border-none bg-transparent'
          },
          submenuheader: { class: 'text-base font-medium leading-none mt-5' }
        }"
        @click="toggleProfile"
        :model="profileMenuSettings"
      />
      <!-- Theme Switch -->
      <div class="flex flex-row justify-between items-center align-middle px-2 py-1.5">
        <span class="text-sm">Theme</span>
        <Dropdown
          :modelValue="selectedTheme"
          @update:modelValue="selectTheme"
          optionValue="value"
          optionLabel="name"
          :options="themeOptions"
          :autoOptionFocus="false"
          :pt="{
            root: { class: 'w-auto items-center align-middle' }
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
      <Divider class="-ml-2 w-[calc(100%+1rem)] mb-3 mt-2" />
      <PrimeButton
        class="w-full h-[38px] rounded-md flex content-start text-left"
        :pt="{
          label: {
            class: 'text-sm font-normal'
          },
          root: {
            class: 'rounded-md hover:surface-200'
          }
        }"
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
            severity="info"
            @click="closeSearch"
            class="not-italic border surface-border text-color-secondary surface-100 cursor-pointer"
            value="ESC"
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
    :draggable="false"
    v-model:visible="createModalStore.isOpen"
    modal
    header="New"
    :pt="{
      root: { class:  'hidden w-full lg:max-w-screen-lg 2xl:max-w-screen-xl h-[640px] sm:flex' },
      content: { class: ' w-full  h-full p-0' },
      mask: { class: 'hidden sm:flex' }
    }"
    position="center"
    class="w-full"
    :dismissableMask="true"
    @update:visible="createModalStore.close()"
  >
    <!-- SLOT WIP -->
    <div>
      <CreateModalBlock @closeModal="createModalStore.close()" />
    </div>
  </PrimeDialog>

  <!-- Mobile modal Create -->
  <Sidebar
    v-model:visible="createModalStore.isOpen"
    position="bottom"
    headerContent="Create something new"
    :show-close-icon="false"
    :pt="{
      root: { class: 'h-[80%] flex p-0 sm:hidden' },
      headerContent: { class: 'w-full' },
      mask: { class: 'flex sm:hidden' }
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2>Create something new</h2>
        <PrimeButton
          icon="pi pi-times"
          @click="createModalStore.close()"
          size="small"
          class="flex-none surface-border text-sm w-8 h-8"
          text
        />
      </div>
    </template>
    <CreateModalBlock />
  </Sidebar>
  <!-- Notification Menu -->
  <PrimeMenu
    ref="menu"
    id="overlay_menu"
    :model="items"
    :popup="true"
  >
    <template #start>
      <!-- SLOT WIP -->
      <div class="m-1 surface-border border border-dashed rounded-md flex items-center h-96">
        <p class="text-color text-sm font-medium text-center w-full">
          This section is under development.
        </p>
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
  import MobileLogo from '@assets/svg/mobile-logo'
  import PrimeDialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import Tag from 'primevue/tag'
  import Dropdown from 'primevue/dropdown'
  import { useAccountStore } from '@/stores/account'
  import { useHelpCenterStore } from '@/stores/help-center'
  import { useCreateModalStore } from '@/stores/create-modal'
  import { mapActions, mapState } from 'pinia'
  import SwitchAccountBlock from '@/templates/switch-account-block'
  import CreateModalBlock from '@/templates/create-modal-block'

  export default {
    name: 'HeaderTemplate',
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
      Tag,
      MobileLogo,
      SwitchAccountBlock,
      CreateModalBlock
    },
    props: {
      isLogged: Boolean,
      listTypeAccountService: {
        type: Function,
        required: true
      },
      accountHandler: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        openSwitchAccount: false,
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
              { label: 'Team Permissions', icon: 'pi pi-user-edit', to: '/teams-permission' },
              { label: 'Billing & Subscriptions', icon: 'pi pi-credit-card' },
              { label: 'Credentials', icon: 'pi pi-id-card' },
              { label: 'Activity History', icon: 'pi pi-history', to: '/activity-history' },
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
            label: 'Marketplace',
            icon: 'pi pi-cart-plus',
            to: '/marketplace'
          },
          {
            label: 'Domains',
            icon: 'pi pi-globe',
            to: '/domains'
          },
          {
            label: 'Build',
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
              }
            ]
          },
          {
            label: 'Secure',
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
              }
            ]
          },
          {
            label: 'Deploy',
            items: [
              {
                label: 'Edge Nodes',
                icon: 'pi pi-database',
                to: '/edge-node'
              }
            ]
          },
          {
            label: 'Observe',
            items: [
              {
                label: 'Data Streaming',
                to: '/data-streaming',
                icon: 'pi pi-play'
              },
              {
                label: 'Real Time Metrics',
                to: '/real-time-metrics',
                icon: 'pi pi-chart-line'
              },
              {
                label: 'Real Time Events',
                to: '/real-time-events',
                icon: 'pi pi-server',
                tag: 'Preview'
              },
              {
                label: 'Edge Pulse',
                to: '/edge-pulse',
                icon: 'pi pi-chart-line'
              }
            ]
          },
          {
            label: 'Tools',
            items: [
              {
                label: 'Real-Time Purge',
                to: '/real-time-purge',
                icon: 'pi pi-refresh'
              }
            ]
          },
          {
            label: 'Edge Libraries ',
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
        profileMenuItemsDefault: [
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
            to: '/teams-permission'
          }
        ],
        profileMenuSettings: [
          {
            label: 'Your Settings',
            to: '/list-your-settings'
          },
          {
            label: 'Personal Token',
            to: '/personal-tokens'
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
      ...mapState(useAccountStore, { user: 'accountData', currentTheme: 'currentTheme' }),
      selectedTheme() {
        return this.themeOptions.find((option) => option.value === this.currentTheme)
      },
      hasAccessToSwitchAccount() {
        return this.user && !this.user.is_client_only
      },
      profileMenuSwitchAccount() {
        return this.profileMenuItemsDefault.map((item) => ({
          ...item,
          command: this.closeSwitchAccountDialog
        }))
      },
      profileMenuItems() {
        const switchAccount =
          this.user && !this.user.is_client_only
            ? [
                {
                  label: 'Switch Account',
                  command: this.openSwitchAccountDialog,
                  class: 'md:hidden'
                }
              ]
            : []

        return [...switchAccount, ...this.profileMenuItemsDefault]
      }
    },
    methods: {
      ...mapActions(useAccountStore, ['setTheme']),
      toggleProfileMobile() {
        this.showProfile = !this.showProfile
      },
      toggleProfile(event) {
        this.$refs.profile.toggle(event)
      },
      redirect(route) {
        this.showSidebar = false
        this.$router.push(route)
      },
      toggleNotification(event) {
        this.$refs.menu.toggle(event)
      },
      openSideBar() {
        this.showSidebar = !this.showSidebar
      },
      closeSideBar() {
        this.showSidebar = false
      },
      openSearch() {
        this.showSearch = true
      },
      closeSearch() {
        this.showSearch = false
      },
      logout() {
        window.location.href = '/logout'
      },
      selectTheme(theme) {
        this.setTheme(theme)
      },
      openSwitchAccountDialog() {
        this.openSwitchAccount = true
      },
      closeSwitchAccountDialog() {
        this.openSwitchAccount = false
      }
    },
    setup() {
      const helpCenterStore = useHelpCenterStore()
      const createModalStore = useCreateModalStore()

      return { helpCenterStore, createModalStore }
    }
  }
</script>
