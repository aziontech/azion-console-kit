<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
    <!-- Footer -->
    <footer
      class="z-10 flex px-3 flex-wrap flex-col md:flex-row pr-3 py-5 md:py-3
      justify-center items-center gap-4 surface-ground border-t surface-border "
    >
      <!-- Logo Azion -->
      <svg @click="this.$router.push('/base')" xmlns="http://www.w3.org/2000/svg"
      class="cursor-pointer"
        width="73" height="14" fill="none" viewBox="0 0 73 14">
        <path
          fill="#F3652B"
          fill-rule="evenodd"
          d="M15.266 0 1.08 11.944.688
          14H2.73l10.99-9.247L11.95 14h2.68l2.683-14h-2.047Zm4.728 0-.507
          2.645h9.26L17.709 11.94 17.313 14h13.943l.507-2.645h-9.26l11.04-9.296L33.938
          0H19.994Zm16.569 0-2.625 14h2.624l2.626-14h-2.625Zm5.306 0-2.681
          14H53.13l2.682-14H41.869Zm2.178 2.645h8.57l-1.667 8.71h-8.571l1.668-8.71ZM69.757
          0l-1.19 6.21 2.166 2.693L72.438 0h-2.681ZM58.494 0l-2.681 14h2.682l1.838-9.598L68.08
          14h1.676l.332-1.714L60.17 0h-1.677Z"
          clip-rule="evenodd"
        />
      </svg>

      <!--  -->
      <div class="text-sm font-normal text-color">© 2023 Azion Technologies.</div>

      <!-- Links -->
      <div class="flex gap-1">
        <PrimeButton label="About" link />
        <PrimeButton label="Blog" link />
        <PrimeButton label="Legal" link />
        <PrimeButton label="Docs" link />
      </div>

      <!-- System Status -->
      <a
        class="border flex gap-2 surface-border surface-ground text-color
        rounded-lg text-sm px-2 py-1 align-items-center justify-center"
        href="https://status.azion.com/"
        target="_blank"
      >
        <b>Status:</b>
        <i class="pi pi-circle-fill text-xs" style="color: rgb(25, 217, 25);" />
        <span>All Systems Operational</span>
      </a>

      <div class="flex flex-row justify-between items-center align-middle px-3 py-1.5">
        <Dropdown
          v-model="selectedTheme"
          :options="themeOptions"
          optionLabel="name"
          :pt="{
            root: { class: 'w-auto py-0 h-[30px] items-center align-middle',
            style: 'background: var(--surface-ground) !important' },
            item: { class: 'text-sm' },
            input: { class: 'text-sm' },
          }"
        >
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

      <!-- Social Buttons -->
      <div class="flex gap-1">
        <PrimeButton class="h-9" icon="pi pi-github" text />
        <PrimeButton class="h-9" icon="pi pi-discord" text />
      </div>
    </footer>
</template>

<script>
// Imports
import Dropdown from 'primevue/dropdown';
import PrimeButton from 'primevue/button';

// Export my assets and components
export default {
  name: 'FooterTemplate',
  components: {
    PrimeButton,
    Dropdown,
  },
  data() {
    return {
      selectedTheme: { name: 'Light', icon: 'pi pi-sun' },
      themeOptions: [
        { name: 'Light', icon: 'pi pi-sun' },
        { name: 'Dark', icon: 'pi pi-moon' },
        { name: 'System', icon: 'pi pi-desktop' },
      ],
    };
  },
};
</script>
