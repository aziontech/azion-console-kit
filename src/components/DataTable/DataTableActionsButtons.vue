<template>
  <div class="flex gap-2">
    <PrimeButton
      v-if="!!otherLink"
      size="small"
      link
      @click="navigateToOtherLink"
    >
      Other Link
    </PrimeButton>
    <PrimeButton
      size="small"
      link
      @click="navigateToGetHelp"
    >
      Get Help
    </PrimeButton>
    <PrimeButton
      v-if="otherActions"
      size="small"
      icon="pi pi-upload"
      @click="emit('other-actions')"
      label="Other Actions"
      severity="primary"
      outlined
      data-testid="data-table-other-actions-button"
    />
    <PrimeButton
      :class="buttonClass"
      :disabled="disabled"
      @click="handleClick"
      icon="pi pi-plus"
      size="small"
      :data-testid="testId"
      :label="label"
    />
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { useRouter } from 'vue-router'
  import { useLayout } from '@/composables/use-layout'
  const { OpenSidebarComponent } = useLayout()
  const router = useRouter()
  const props = defineProps({
    label: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    buttonClass: {
      type: [String, Object, Array],
      default: ''
    },
    testId: {
      type: String,
      default: null
    },
    createPagePath: {
      type: String,
      default: null
    },
    otherLink: {
      type: String,
      default: null
    },
    getHelpLink: {
      type: String,
      default: null
    },
    otherActions: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['click', 'other-actions'])

  const handleClick = () => {
    emit('click')
    if (props.createPagePath) {
      router.push({ path: props.createPagePath })
    }
  }

  const navigateToOtherLink = () => {
    if (props.otherLink) {
      router.push({ path: props.otherLink })
    }
  }

  const navigateToGetHelp = () => {
    if (props.getHelpLink) {
      router.push({ path: props.getHelpLink })
    } else {
      OpenSidebarComponent('copilot')
    }
  }
</script>
