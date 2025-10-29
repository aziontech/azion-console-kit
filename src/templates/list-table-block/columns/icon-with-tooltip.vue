<template>
  <div class="flex items-center">
    <i
      v-if="vendorData"
      :class="iconClass"
      v-tooltip.top="vendorData"
      class="cursor-pointer"
    ></i>
    <span v-else>-</span>
  </div>
</template>

<script setup>
  defineProps({
    vendorData: String,
    iconClass: {
      type: String,
      default: 'pi pi-shopping-cart text-xl'
    }
  })
</script>
