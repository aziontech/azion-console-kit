<template>
  <div class="w-full">
    <Steps
      class="w-full"
      :model="stepsItems"
      :readonly="false"
      :pt="{
        menuitem: ({ context }) => ({
          class: isActive(context.item) && 'p-highlight p-steps-current'
        })
      }"
    >
      <template #item="{ label, item, index, props }">
        <router-link
          v-if="item.route"
          v-slot="routerProps"
          :to="item.route"
          custom
        >
          <a
            :href="routerProps.href"
            v-bind="props.action"
            @click="($event) => routerProps.navigate($event)"
            @keydown.enter="($event) => routerProps.navigate($event)"
          >
            <span v-bind="props.step">{{ index + 1 }}</span>
            <span v-bind="props.label">{{ label }}</span>
          </a>
        </router-link>
        <span
          v-else
          v-bind="props.action"
        >
          <span v-bind="props.step">{{ index + 1 }}</span>
          <span v-bind="props.label">{{ label }}</span>
        </span>
      </template>
    </Steps>
    <RouterView></RouterView>
  </div>
</template>

<script>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import Steps from 'primevue/steps'

  export default {
    name: 'StepsBlock',
    components: {
      Steps
    },
    props: {
      stepsItems: {
        type: Array,
        required: true
      }
    },
    setup() {
      const router = useRouter()
      const currentRoutePath = ref('')

      const isActive = (item) => {
        return item.route ? item.route === currentRoutePath.value : false
      }

      onMounted(() => {
        currentRoutePath.value = router.currentRoute.value.path
      })

      return {
        router,
        currentRoutePath,
        isActive
      }
    }
  }
</script>
