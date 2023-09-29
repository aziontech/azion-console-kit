<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Footer -->
  <footer
    class="z-10 flex px-3 flex-wrap flex-col md:flex-row pr-3 py-5 md:py-3 justify-center items-center gap-4 surface-ground border-t surface-border"
  >
    <Logo />

    <div class="text-sm font-normal text-color">© 2023 Azion Technologies.</div>

    <!-- Links -->
    <div class="flex gap-1">
      <PrimeButton
        label="About"
        link
      />
      <PrimeButton
        label="Blog"
        link
      />
      <PrimeButton
        label="Legal"
        link
      />
      <PrimeButton
        label="Docs"
        link
      />
    </div>

    <!-- System Status -->
    <SystemStatusBarBlock />

    <div class="flex flex-row justify-between items-center align-middle px-3 py-1.5">
      <Dropdown
        :modelValue="selectedTheme"
        @update:modelValue="selectTheme"
        optionValue="value"
        optionLabel="name"
        :loading="!selectedTheme?.value"
        :options="themeOptions"
        :autoOptionFocus="false"
        :pt="{
          root: {
            class: 'w-auto py-0 h-[30px] items-center align-middle',
            style: 'background: var(--surface-ground) !important'
          },
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

    <!-- Social Buttons -->
    <div class="flex gap-1">
      <PrimeButton
        class="h-9"
        icon="pi pi-github"
        text
      />
      <PrimeButton
        class="h-9"
        icon="pi pi-discord"
        text
      />
    </div>
  </footer>
</template>

<script>
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'
  import SystemStatusBarBlock from '@templates/system-status-bar-block'
  import Logo from '@assets/svg/logo'
  import { useAccountStore } from '@/stores/account'
  import { mapActions, mapState } from 'pinia'

  export default {
    name: 'FooterTemplate',
    components: {
      PrimeButton,
      Dropdown,
      Logo,
      SystemStatusBarBlock
    },
    data() {
      return {
        themeOptions: [
          { name: 'Light', value: 'light', icon: 'pi pi-sun' },
          { name: 'Dark', value: 'dark', icon: 'pi pi-moon' },
          { name: 'System', value: 'system', icon: 'pi pi-desktop' }
        ]
      }
    },
    computed: {
      ...mapState(useAccountStore, ['currentTheme']),
      selectedTheme() {
        return this.themeOptions.find((option) => option.value === this.currentTheme)
      }
    },
    methods: {
      ...mapActions(useAccountStore, ['setTheme']),
      selectTheme(theme) {
        this.setTheme(theme)
      }
    }
  }
</script>
