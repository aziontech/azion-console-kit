<template>
  <footer
    style="border-top: 1px solid var(--surface-border)"
    class="bg-white z-10 flex pl-3 flex-wrap pr-3 py-2 justify-center items-center gap-3"
  >
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="
            M17.5256 5.66406L5.01478
            16.1968L4.66968 18.0098H6.47214L16.1633
            9.85505L14.6013 18.0098H16.9653L19.3302
            5.66406H17.5256Z
          "
        fill="#F3652B"
      />
    </svg>
    <div style="color: var(--text-color-secondary)" class="text-sm font-normal">
      © 2023 Azion Technologies.
    </div>
    <div class="flex flex-wrap items-center justify-center gap-1">
      <PrimeButton label="About" link />
      <PrimeButton label="Blog" link />
      <PrimeButton label="Legal & Privacy" link />
      <PrimeButton label="Docs" link />
      <PrimeButton label="Status" link />
    </div>
  </footer>
</template>

<script>
import PrimeButton from 'primevue/button'

export default {
  name: 'footer-block',
  components: {
    PrimeButton
  }
}
</script>
