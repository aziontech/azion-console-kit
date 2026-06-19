<script setup>
  import PrimeButton from 'primevue/button'
  import CardBox from '@aziontech/webkit/content/card-box'

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
  <CardBox
    title="Template Settings"
    data-testid="template-engine__settings-card"
    :class="{ '[&>footer]:hidden': props.hideFooter }"
  >
    <template #content>
      <div class="p-4 sm:p-6 flex flex-col gap-6">
        <slot name="form">
          <div class="flex flex-col gap-6"></div>
        </slot>
      </div>
    </template>

    <template #footer>
      <slot name="footer-actions">
        <PrimeButton
          type="button"
          class="w-full flex-row-reverse"
          data-testid="template-engine__settings-deploy-button"
          :label="props.deployLabel"
          :loading="props.loadingDeploy"
          :disabled="props.disabledDeploy"
          severity="primary"
          @click="handleDeploy"
        />
      </slot>
    </template>
  </CardBox>
</template>
