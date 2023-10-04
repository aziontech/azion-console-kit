<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Footer -->
  <footer
    class="z-10 flex px-3 py-6 flex-wrap flex-col justify-center items-center gap-3 lg:gap-4 surface-ground border-t surface-border lg:flex-row pr-3 lg:py-3 lg:px-8 lg:justify-between">
    <span class="text-sm text-normal text-color">© 2023 Azion Technologies.</span>

    <div class="flex flex-col gap-3 lg:gap-8 items-center lg:flex lg:flex-row">
      <div class="flex gap-1">
        <PrimeButton label="About" link />
        <PrimeButton label="Blog" link />
        <PrimeButton label="Legal" link />
        <PrimeButton label="Docs" link />
      </div>
      <!-- Social Buttons -->
      <div class="flex gap-2">
        <PrimeButton icon="pi pi-github" text size="small" />
        <PrimeButton icon="pi pi-discord" text size="small" />
        <PrimeButton icon="pi pi-twitter" text size="small" />
        <!--Change Twitter icon to X-->
      </div>

      <div class="flex gap-8">
        <!-- System Status -->
        <SystemStatusBarBlock />

        <Dropdown v-model="selectedTheme" :options="themeOptions" optionLabel="name" :pt="{
          root: {
            class: 'w-auto items-center h-7',
            style: 'background: var(--surface-section) !important'
          },
          item: { class: 'text-sm' },
          input: { class: 'text-sm' }
        }">
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex gap-2 align-items-center">
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
    </div>
  </footer>
</template>

<script>
import Dropdown from 'primevue/dropdown'
import PrimeButton from 'primevue/button'
import SystemStatusBarBlock from '@templates/system-status-bar-block'

export default {
  name: 'FooterTemplate',
  components: {
    PrimeButton,
    Dropdown,
    SystemStatusBarBlock
  },
  data() {
    return {
      selectedTheme: { name: 'Light', icon: 'pi pi-sun' },
      themeOptions: [
        { name: 'Light', icon: 'pi pi-sun' },
        { name: 'Dark', icon: 'pi pi-moon' },
        { name: 'System', icon: 'pi pi-desktop' }
      ]
    }
  }
}
</script>
