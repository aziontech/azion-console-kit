<template>
    <Message
    :pt="{
        root: { class: 'w-full px-2 md:px-6'},
        text: { class: 'w-full'},
        icon: { class: 'hidden'}
    }"
    >
        <div class="flex w-full flex-col md:flex-row items-start gap-4 md:items-center py-4 md:py-1">
            <div class="flex md:flex-row flex-col items-start md:items-center gap-2 w-full">
                <LaunchweekLogo />
                <span class="font-normal text-sm text-color-secondary w-full text-balance">Register to join in Azion Product Launchweek May 2025. Virtual and free.</span>
            </div>
            <a class="p-button p-button-secondary p-button-sm mr-2 pr-3.5" target="_blank" href="https://www.azion.com/en/azion-launch-week/">Register</a>
        </div>
    </Message>
</template>

<script setup>
    import Message from 'primevue/message'
    import LaunchweekLogo from '@/assets/svg/launchweek-logo.vue'
    defineOptions({ name: 'BannerFullBlock' })
</script>