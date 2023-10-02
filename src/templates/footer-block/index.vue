<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Footer -->
  <footer
    class="z-10 flex px-3 py-6 flex-wrap flex-col justify-center items-center gap-4 surface-ground border-t surface-border md:flex-row pr-3 md:py-3 md:px-8 md:justify-between"
  >
    <div class="text-sm font-normal text-color">© 2023 Azion Technologies.</div>

    <div class="flex gap-8">
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
      <!-- Social Buttons -->
      <div class="flex gap-2">
        <PrimeButton
          icon="pi pi-github"
          text
        />
        <PrimeButton
          icon="pi pi-discord"
          text
        />
        <PrimeButton
          icon="pi pi-twitter"
          text
        />
        <!--Change Twitter icon to X-->
      </div>
  
      <!-- System Status -->
      <SystemStatusBarBlock />
  
      <div class="flex flex-row justify-between items-center align-middle px-3 py-1.5">
        <Dropdown
          v-model="selectedTheme"
          :options="themeOptions"
          optionLabel="name"
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
