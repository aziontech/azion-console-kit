<template>
  <Tag
    icon="pi pi-user"
    severity="info"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'user'"
  />
  <Tag
    icon="pi pi-users"
    severity="info"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'account'"
  />
  <Tag
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'azion'"
  >
    <MobileLogo class="w-3 h-3" />
  </Tag>
</template>

<script setup>
  import MobileLogo from '@assets/svg/mobile-logo'
  import Tag from '@aziontech/webkit/tag'

  defineProps({
    chartOwner: {
      type: String,
      default: 'azion',
      validator(value) {
        return ['azion', 'account', 'user'].includes(value)
      }
    }
  })
</script>
