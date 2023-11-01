<template>
  <div class="p-4 w-full">
    <div class="max-w-screen-sm lg:max-w-7xl mx-auto gap-4">
      <i class="ai ai-twitter text-lg text-color" />
      <i class="pi pi-twitter text-lg text-color"/>
      <i class="pi pi-google" style="font-size: 120px; color: red;"/>
      <i class="ai ai-column" style="font-size: 120px; color: red;" />
    </div>
  </div>
</template>

<script>
import CustomIcon from "@/assets/icons/CustomIcon"

export default {
  components: {
    CustomIcon,
  },
};
</script>
