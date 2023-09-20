<template>
  <SingleBlock pageTitle="Edge Pulse">
    <template #content>
      <h1>Default Tag:</h1>
      <p>
        Place this tag in the HTML of the switched pages to measure them. You should place it just
        before the closing BODY tag. This script waits until the load event is complete before
        downloading and executing the RUM Client, ensuring that the load event is uninterrupted and
        has zero impact on user experience.
      </p>

      <pre>
        &lt;script>
if (typeof window.addEventListener === "function") {
    window.addEventListener("load", function() {
        if (window.azpulse === undefined) {
            var pulse = document.createElement("script");
            pulse.src = "//client.azionrum.net/8900e/azion-pulse.js";
            document.body.appendChild(pulse);
        }
    });
}
&lt;/script>
      </pre>
      <PrimeButton label="Copy to Clipboard" />

      <h1>Pre-loading Tag:</h1>
      <p>
        If you're using Content Security Policy settings preventing the use of inline JavaScript
        then place this tag just before the enclosing BODY tag. This script executes before the load
        event has fired.
      </p>
      <pre>
        &lt;script async src="//client.azionrum.net/8900e/azion-pulse.js">&lt;/script>
      </pre>
    </template>
  </SingleBlock>
</template>

<script>
  import SingleBlock from '@/templates/single-block'
  import PrimeButton from 'primevue/button'

  export default {
    name: 'edge-pulse-view',
    components: {
      PrimeButton,
      SingleBlock
    },
    props: {},
    computed: {}
  }
</script>
