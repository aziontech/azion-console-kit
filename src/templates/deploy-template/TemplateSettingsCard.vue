<script setup>
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from './BaseDeployCard.vue'

  const props = defineProps({
    // Preview for header-meta (compact summary from step 1)
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },
    templateTitle: {
      type: String,
      required: true
    },
    templateUrl: {
      type: String,
      required: true
    },
    githubUrl: {
      type: String,
      default: ''
    },

    // Footer action
    loadingDeploy: {
      type: Boolean,
      default: false
    },
    disabledDeploy: {
      type: Boolean,
      default: false
    },
    deployLabel: {
      type: String,
      default: 'Deploy'
    },

    // Hide footer when deploying
    hideFooter: {
      type: Boolean,
      default: false
    }
  })
  const emit = defineEmits(['deploy'])
  const handleDeploy = () => {
    emit('deploy')
  }
</script>

<template>
  <BaseDeployCard
    title="Template Settings"
    :hide-footer="props.hideFooter"
  >
    <template #content>
      <slot name="form">
        <div class="flex flex-col gap-6"></div>
      </slot>
    </template>

    <template #footer>
      <slot name="footer-actions">
        <PrimeButton
          type="button"
          class="w-full flex-row-reverse"
          :label="props.deployLabel"
          :loading="props.loadingDeploy"
          :disabled="props.disabledDeploy"
          severity="primary"
          @click="handleDeploy"
        />
      </slot>
    </template>
  </BaseDeployCard>
</template>
