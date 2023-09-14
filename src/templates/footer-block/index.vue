<template>
  <footer
    style="border-top: 1px solid var(--surface-border)"
    class="z-10 flex pl-3 flex-wrap pr-3 py-2 justify-center items-center gap-3"
  >
    <AzionLogo />
    <div
      style="color: var(--text-color-secondary)"
      class="text-sm font-normal"
    >
      © 2023 Azion Technologies.
    </div>
    <div class="flex flex-wrap items-center justify-center gap-1">
      <PrimeButton
        label="About"
        link
      />
      <PrimeButton
        label="Blog"
        link
      />
      <PrimeButton
        label="Legal & Privacy"
        link
      />
      <PrimeButton
        label="Docs"
        link
      />
      <PrimeButton
        label="Status"
        link
      />
    </div>
  </footer>
</template>

<script>
  import AzionLogo from '../../assets/svg/azion-logo'
  import PrimeButton from 'primevue/button'

  export default {
    name: 'footer-block',
    components: {
      PrimeButton,
      AzionLogo
    }
  }
</script>
