<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="18"
    fill="none"
    viewBox="0 0 22 18"
  >
    <path
      :fill="fill"
      fill-rule="evenodd"
      d="M18.744 0 .504 15.357
            0 18h2.628l14.13-11.89L14.48
            18h3.447l3.448-18h-2.631Z"
      clip-rule="evenodd"
    />
  </svg>
</template>

<script>
  export default {
    name: 'azion-mobile-logo',
    props: {
      fill: {
        type: String,
        default: '#F3652B'
      }
    }
  }
</script>
