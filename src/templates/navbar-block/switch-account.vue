<template>
  <SwitchAccountBlock
    class="ml-2"
    v-if="hasAccessToSwitchAccount"
    v-model:showSwitchAccount="openSwitchAccount"
    :accessMenu="profileMenuSwitchAccount"
    :account="user"
    :listTypeAccountService="props.listTypeAccountService"
    :accountHandler="props.accountHandler"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import SwitchAccountBlock from '@/templates/switch-account-block'
  import { getStaticUrlsByEnvironment } from '@/helpers'

  const props = defineProps({
    listTypeAccountService: {
      type: Function,
      required: true
    },
    accountHandler: {
      type: Object,
      required: true
    }
  })

  const billingUrl = getStaticUrlsByEnvironment('billing')
  const user = useAccountStore().accountData
  const openSwitchAccount = inject('openSwitchAccount')
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

  const closeSwitchAccountDialog = () => {
    openSwitchAccount.value = false
  }

  const hasAccessToSwitchAccount = computed(() => {
    return user && !user.is_client_only
  })

  const profileMenuSwitchAccount = computed(() => {
    return profileMenuDefault.map((item) => ({
      ...item,
      command: closeSwitchAccountDialog
    }))
  })
</script>
