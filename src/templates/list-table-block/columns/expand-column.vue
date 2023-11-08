<template>
  <ul class="flex flex-col gap-1">
    <li
      v-for="(item, index) in splitValue"
      :key="index"
    >
      {{ item }}
    </li>
    <li
      v-if="!showAllItens && value.length > 2"
      @click="showAll"
      class="underline cursor-pointer"
    >
      Show more ({{ value.length - 2 }})
    </li>
    <li
      v-if="showAllItens && value.length > 2"
      @click="showAll"
      class="underline cursor-pointer"
    >
      Show less
    </li>
  </ul>
</template>

<script>
  export default {
    name: 'expand-column',
    props: {
      value: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
        showAllItens: false
      }
    },
    computed: {
      splitValue() {
        return this.showAllItens ? this.value : this.value.slice(0, 2)
      }
    },
    methods: {
      showAll() {
        this.showAllItens = !this.showAllItens
      }
    }
  }
</script>
