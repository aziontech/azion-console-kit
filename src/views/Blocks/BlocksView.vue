<template>
  <div class="surface-ground relative overflow-hidden">
    <div class="w-full border-b surface-border surface-section flex justify-between px-6 py-2">
      <PrimeButton
        icon="pi pi-home"
        outlined
        class="w-3rem surface-border"
        @click="redirectToBase"
      />
      <!-- Search -->
      <span class="p-input-icon-left p-input-icon-right hidden">
        <i class="pi pi-search" />
        <i style="top: 35% !important">
          <Tag
            class="not-italic border surface-border text-color-secondary cursor-pointer surface-100"
            value="⌘ + K"
            @click="showSearch = true"
          />
        </i>
        <InputText
          v-model:visible="visibleLeft"
          class="w-64"
          placeholder="Search..."
          disabled
          size="small"
        />
      </span>
      <ToggleButton
        v-model="isDark"
        @change="changeTheme"
        onLabel=""
        offLabel=""
        onIcon="pi pi-sun"
        offIcon="pi pi-moon"
        class="w-3rem"
      />
    </div>
    <RouterView />
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Tag from 'primevue/tag'
  import ToggleButton from 'primevue/togglebutton'
  // import toggleTheme from '@/helpers/themeChanger'

  export default {
    name: 'blocks-view',
    components: {
      InputText,
      Tag,
      PrimeButton,
      ToggleButton
    },
    data() {
      return { isDark: false }
    },
    mounted() {
      if (localStorage.getItem('theme')) this.changeTheme()
    },
    methods: {
      changeTheme() {
        //this.isDark = toggleTheme(this)
      },
      redirectToBase() {
        // Use o router.push para redirecionar para a rota /base
        this.$router.push('/')
      }
    }
  }
</script>
