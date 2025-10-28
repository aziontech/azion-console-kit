<template>
  <div class="flex items-center gap-2 justify-end">
    <div
      class="flex justify-end"
      v-if="isSingleAction"
      data-testid="data-table-actions-column-body-action"
    >
      <PrimeButton
        size="small"
        outlined
        v-bind="singleActionProps"
        @click="handleSingleAction"
        class="cursor-pointer table-button"
        data-testid="data-table-actions-column-body-action-button"
      />
    </div>
    <div
      class="flex justify-end"
      v-else
      data-testid="data-table-actions-column-body-actions"
    >
      <PrimeMenu
        :ref="setMenuRef"
        id="overlay_menu"
        v-bind:model="menuActions"
        :popup="true"
        data-testid="data-table-actions-column-body-actions-menu"
      />
      <PrimeButton
        v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
        size="small"
        icon="pi pi-ellipsis-v"
        outlined
        @click="handleMenuToggle"
        class="cursor-pointer table-button"
        data-testid="data-table-actions-column-body-actions-menu-button"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'

  const props = defineProps({
    rowData: {
      type: Object,
      required: true
    },
    actions: {
      type: [Array, Function],
      required: true
    },
    singleAction: {
      type: [Object, Function],
      default: null
    },
    onActionExecute: {
      type: Function,
      default: () => {}
    },
    onMenuToggle: {
      type: Function,
      default: () => {}
    },
    menuRefSetter: {
      type: Function,
      default: null
    }
  })

  const menuRef = ref(null)

  const isSingleAction = computed(() => {
    return props.singleAction !== null
  })

  const singleActionProps = computed(() => {
    if (typeof props.singleAction === 'function') {
      return props.singleAction(props.rowData)
    }
    return props.singleAction || {}
  })

  const menuActions = computed(() => {
    if (typeof props.actions === 'function') {
      return props.actions(props.rowData)
    }
    return props.actions || []
  })

  const handleSingleAction = () => {
    props.onActionExecute(props.rowData)
  }

  const handleMenuToggle = (event) => {
    props.onMenuToggle(event, props.rowData.id)
  }

  const setMenuRef = (el) => {
    menuRef.value = el
    if (props.menuRefSetter && props.rowData.id) {
      props.menuRefSetter(props.rowData.id)(el)
    }
  }
</script>
