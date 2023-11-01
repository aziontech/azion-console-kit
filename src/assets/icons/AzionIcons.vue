<template>
  <i
    :class="iconClass"
    :style="customStyles"
  ></i>
</template>

<script>
  export default {
    props: {
      name: String
    },
    computed: {
      iconClass() {
        return `ci ci-${this.name}`
      },
      customStyles() {
        return {
          fontSize: this.fontSize,
          color: this.color
        }
      }
    },
    data() {
      return {
        fontSize: 'inherit',
        color: 'inherit'
      }
    }
  }
</script>

<style>
  @font-face {
    font-family: 'azionicons';
    src: url('azionicons.woff2') format('woff2');
  }
  .ai {
    font-family: 'azionicons';
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    display: inline-block;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Icons */
  .ai.ai-twitter::before {
    content: '\0001';
  }
  .ai.ai-column::before {
    content: '\0002';
  }
</style>
