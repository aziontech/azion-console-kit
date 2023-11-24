<template>
  <div class="p-6 mt-2 rounded bg-gray-900 bg-header relative overflow-hidden">
    <div class="flex flex-col items-start gap-4 max-w-xs w-full">
      <h1 class="text-white text-sm leading-7 w-2/3">
        Connect and build together with the Azion Community.
      </h1>

      <a
        href="https://discord.com/invite/Yp9N7RMVZy"
        class="p-button gap-2"
        icon="pi pi-discord"
        target="_blank"
      >
        <i class="pi pi-discord"></i>
        Join Discord</a
      >
    </div>
    <DiscordLogo />
  </div>
</template>

<script>
  import DiscordLogo from '@assets/svg/discord-logo'

  export default {
    name: 'BannerDiscord',
    components: {
      DiscordLogo
    }
  }
</script>
