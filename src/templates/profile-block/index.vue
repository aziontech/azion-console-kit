<template>
  <Avatar
    @click="toggleProfile"
    icon="pi pi-user"
    class="transition-all bg-header-avatar cursor-pointer"
    v-tooltip.bottom="{ value: 'Account', showDelay: 200 }"
    data-testid="profile-block__avatar"
  />

  <Sidebar
    data-testid="profile-block__sidebar"
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
      data-testid="profile-block__sidebar__profile-menu"
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
            <span
              class="text-sm font-medium"
              data-testid="profile-block__profile-menu__user-name"
              >{{ user.name }}</span
            >
            <div class="flex gap-2">
              <span
                class="text-xs"
                data-testid="profile-block__profile-menu__user-id"
                >ID: {{ user.id }}</span
              >
              <span
                class="text-xs"
                data-testid="profile-block__profile-menu__client-id"
                >Client ID: {{ user.client_id }}</span
              >
            </div>
          </div>
        </div>
      </template>
      <template #end>
        <PrimeMenu
          data-testid="profile-block__sidebar__settings-menu"
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
                <span
                  class="text-sm font-medium leading-none"
                  data-testid="profile-block__settings-menu__full-name"
                  >{{ user.full_name }}</span
                >
                <span
                  class="text-xs"
                  data-testid="profile-block__settings-menu__email"
                  >{{ user.email }}</span
                >
              </div>
            </div>
          </template>
        </PrimeMenu>

        <div
          class="flex flex-row justify-between items-center align-middle px-2 py-1.5"
          data-testid="profile-block__settings-menu__theme"
        >
          <span
            class="text-sm"
            data-testid="profile-block__theme__label"
          >
            Theme
          </span>
          <Dropdown
            data-testid="profile-block__theme__options"
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
                <i
                  :data-testid="`profile-block__theme-value__icon-${slotProps.value.icon}`"
                  :class="slotProps.value.icon"
                ></i>
                <div :data-testid="`profile-block__theme-value__value-${slotProps.value.name}`">
                  {{ slotProps.value.name }}
                </div>
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex gap-2 align-items-center">
                <i
                  :data-testid="`profile-block__theme-options__icon-${slotProps.value.icon}`"
                  :class="slotProps.option.icon"
                ></i>
                <div :data-testid="`profile-block__theme-options__option-${slotProps.value.name}`">
                  {{ slotProps.option.name }}
                </div>
              </div>
            </template>
          </Dropdown>
        </div>
        <Divider class="surface-border p-1 m-0" />
        <PrimeButton
          data-testid="profile-block__sidebar__logout-btn"
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
    data-testid="profile-block__mobile-profile-menu"
    style="position: fixed !important; top: 46px"
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
          <span
            class="text-sm font-medium"
            data-testid="profile-block__mobile-profile-menu__user-name"
            >{{ user.name }}</span
          >
          <div class="flex gap-2">
            <span
              class="text-xs"
              data-testid="profile-block__mobile-profile-menu__user-id"
              >ID: {{ user.id }}</span
            >
            <span
              class="text-xs"
              data-testid="profile-block__mobile-profile-menu__client-id"
              >Client ID: {{ user.client_id }}</span
            >
          </div>
        </div>
      </div>
    </template>
    <template #end>
      <PrimeMenu
        data-testid="profile-block__mobile-profile-menu__settings-menu"
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
              <span
                class="text-sm font-medium leading-none"
                data-testid="profile-block__mobile-settings-menu__full-name"
                >{{ user.full_name }}</span
              >
              <span
                class="text-xs"
                data-testid="profile-block__mobile-settings-menu__email"
                >{{ user.email }}</span
              >
            </div>
          </div>
        </template>
      </PrimeMenu>
      <div
        class="flex flex-row justify-between items-center align-middle px-2 py-1.5"
        data-testid="profile-block__mobile-settings-menu__theme"
      >
        <span
          class="text-sm"
          data-testid="profile-block__mobile-theme__label"
          >Theme</span
        >
        <Dropdown
          data-testid="profile-block__mobile-theme__options"
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
              <i
                :data-testid="`profile-block__mobile-theme-value__icon-${slotProps.value.name}`"
                :class="slotProps.value.icon"
              ></i>
              <div
                :data-testid="`profile-block__mobile-theme-value__value-${slotProps.value.name}`"
              >
                {{ slotProps.value.name }}
              </div>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex gap-2 align-items-center">
              <i
                :data-testid="`profile-block__mobile-theme-option__icon-${slotProps.option.name}`"
                :class="slotProps.option.icon"
              ></i>
              <div
                :data-testid="`profile-block__mobile-theme-option__icon-${slotProps.option.name}`"
              >
                {{ slotProps.option.name }}
              </div>
            </div>
          </template>
        </Dropdown>
      </div>
      <Divider class="-ml-2 w-[calc(100%+1rem)] mb-3 mt-2" />
      <PrimeButton
        data-testid="profile-block__mobile-menu__logout-btn"
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
  import { useAccountStore } from '@/stores/account'
  import { computed, inject, ref, watch, onBeforeMount } from 'vue'
  import { storeToRefs } from 'pinia'
  import Avatar from 'primevue/avatar'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import PrimeMenu from 'primevue/menu'
  import Sidebar from 'primevue/sidebar'
  import { useLoadingStore } from '@/stores/loading'

  defineOptions({ name: 'profile-block' })
  const { startLoading } = useLoadingStore()
  const user = useAccountStore().accountData
  const { currentTheme } = storeToRefs(useAccountStore())
  const { hasAccessToSSOManagement } = storeToRefs(useAccountStore())
  const setTheme = useAccountStore().setTheme

  onBeforeMount(() => {
    switch (user.kind) {
      case 'brand':
        profileMenuDefault.push({
          label: 'Resellers Management',
          to: '/resellers'
        })
        break
      case 'company':
        profileMenuDefault.push({
          label: 'Groups Management',
          to: '/groups'
        })
        break
      case 'reseller':
        profileMenuDefault.push({
          label: 'Clients Management',
          to: '/clients'
        })
        break
    }
  })

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
      to: '/billing'
    },
    {
      label: 'Activity History',
      to: '/activity-history'
    },
    {
      label: 'Teams Permissions',
      to: '/teams-permission'
    },
    ...(hasAccessToSSOManagement.value
      ? [{ label: 'SSO Management', to: '/identity-providers' }]
      : [])
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

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
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
    startLoading()
    tracker.reset()
    closeDesktopMenu()
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
