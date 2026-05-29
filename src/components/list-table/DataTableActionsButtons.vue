<template>
  <div class="flex !flex-row items-center gap-2 w-fit justify-start md:w-auto">
    <PrimeButton
      kind="text"
      label="Other Link"
      v-if="!!otherLink"
      size="small"
      @click="navigateToOtherLink"
    />
    <PrimeButton
      kind="text"
      label="Get Help"
      size="small"
      @click="navigateToGetHelp"
    />
    <PrimeButton
      kind="primary"
      v-if="otherActions"
      size="small"
      icon="pi pi-upload"
      @click="emit('other-actions')"
      label="Other Actions"
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
  import PrimeButton from '@aziontech/webkit/button'
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
