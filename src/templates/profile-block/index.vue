<template>
  <Avatar
    @click="toggleProfile"
    icon="pi pi-user"
    class="transition-all bg-header-avatar cursor-pointer"
    v-tooltip.bottom="{ value: 'Account', showDelay: 200 }"
  />

  <Sidebar
    v-model:visible="showProfile"
    header="Bottom Sidebar"
    position="bottom"
    :show-close-icon="false"
    :pt="{
      root: { class: 'h-auto flex' },
      header: { class: 'hidden' },
      content: { class: 'p-0' }
    }"
  >
    <!-- Mobile Menu Navigation -->
    <PrimeMenu
      :model="profileMenuItems"
      :pt="{
        root: { class: 'w-full border-none bg-transparent' },
        submenuheader: { class: 'text-base font-medium leading-none' },
        content: { class: 'text-sm' }
      }"
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
          :model="profileMenuSettings"
          :pt="{
            root: { class: 'p-0 w-full border-none bg-transparent' },
            submenuheader: { class: 'text-base font-medium leading-none' },
            content: { class: 'text-sm' }
          }"
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
        <div class="flex flex-row justify-between items-center align-middle px-2 py-1.5">
          <span class="text-sm">Theme</span>
          <Dropdown
            appendTo="self"
            :modelValue="selectedTheme"
            @update:modelValue="setSelectedTheme"
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
        <Divider class="surface-border p-1 m-0" />
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

  <PrimeMenu
    style="position: fixed !important; top: 46px;"
    :model="profileMenuItems"
    :popup="true"
    ref="profile"
    :pt="{
      root: { class: 'w-[280px] pb-2 pt-0' },
      content: { class: 'text-sm' }
    }"
  >
    <template #start>
      <div class="flex flex-column px-2.5 py-3 mt-2 h-14 justify-center">
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
        :model="profileMenuSettings"
        :pt="{
          root: { class: 'p-0 w-full border-none bg-transparent' },
          submenuheader: { class: 'text-base font-medium leading-none' },
          content: { class: 'text-sm' }
        }"
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
      <div class="flex flex-row justify-between items-center align-middle px-2 py-1.5">
        <span class="text-sm">Theme</span>
        <Dropdown
          appendTo="self"
          :modelValue="selectedTheme"
          @update:modelValue="setSelectedTheme"
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
      <Divider class="-ml-2 w-[calc(100%+1rem)] mb-3 mt-2" />
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
</template>

<script setup>
  import { getStaticUrlsByEnvironment } from '@/helpers'
  import { useAccountStore } from '@/stores/account'
  import { computed, inject, ref, watch } from 'vue'

  import { storeToRefs } from 'pinia'
  import Avatar from 'primevue/avatar'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import PrimeMenu from 'primevue/menu'
  import Sidebar from 'primevue/sidebar'

  defineOptions({ name: 'profile-block' })

  const user = useAccountStore().accountData
  const { currentTheme } = storeToRefs(useAccountStore())
  const setTheme = useAccountStore().setTheme

  const profile = ref(null)
  const showProfile = ref(false)
  const profileMenuDefault = [
    {
      label: 'Account Settings',
      to: '/account/settings'
    },
    {
      label: 'Users Management',
      to: '/users'
    },
    {
      label: 'Billing & Subscriptions',
      command: () => {
        const billingUrl = getStaticUrlsByEnvironment('billing')
        window.open(billingUrl, '_blank')
      }
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
  ]
  const profileMenuSettings = [
    {
      label: 'Your Settings',
      to: '/settings'
    },
    {
      label: 'Personal Token',
      to: '/personal-tokens'
    }
  ]
  const themeOptions = [
    { name: 'Light', value: 'light', icon: 'pi pi-sun' },
    { name: 'Dark', value: 'dark', icon: 'pi pi-moon' },
    { name: 'System', value: 'system', icon: 'pi pi-desktop' }
  ]
  const currentWidth = inject('currentWidth')
  const openSwitchAccount = inject('openSwitchAccount')
  const SCREEN_BREAKPOINT_MD = 768

  const toggleProfile = (event) => {
    if (window.innerWidth <= SCREEN_BREAKPOINT_MD) {
      showProfile.value = !showProfile.value
    } else {
      profile.value.toggle(event)
    }
  }

  const closeMobileMenu = () => {
    showProfile.value = false
  }

  const closeDesktopMenu = () => {
    profile.value.hide()
  }

  const setSelectedTheme = (theme) => {
    setTheme(theme)
  }

  const logout = () => {
    window.location.href = '/logout'
  }

  const openSwitchAccountDialog = () => {
    openSwitchAccount.value = true
  }

  const selectedTheme = computed(() => {
    return themeOptions.find((option) => option.value === currentTheme.value)
  })

  const profileMenuItems = computed(() => {
    const switchAccount =
      user && !user.is_client_only
        ? [
            {
              label: 'Switch Account',
              command: openSwitchAccountDialog,
              class: 'md:hidden'
            }
          ]
        : []

    const separator = { separator: true }

    return [...switchAccount, ...profileMenuDefault, separator]
  })

  watch(currentWidth, async (width) => {
    if (width <= SCREEN_BREAKPOINT_MD) {
      closeDesktopMenu()
    } else if (width > SCREEN_BREAKPOINT_MD && showProfile.value) {
      closeMobileMenu()
    }
  })
</script>
