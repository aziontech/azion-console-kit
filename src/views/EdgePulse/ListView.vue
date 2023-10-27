<template>
  <div>
    <SingleBlock pageTitle="Edge Pulse">
      <template #content>
        <div class="flex flex-col gap-4 lg:w-1/2">
          <b>Default Tag:</b>
          <p>
            Place this tag in the HTML of the switched pages to measure them. You should place it
            just before the closing BODY tag. This script waits until the load event is complete
            before downloading and executing the RUM Client, ensuring that the load event is
            uninterrupted and has zero impact on user experience.
          </p>
          <vue-monaco-editor
            v-model:value="defaultTagCode"
            language="javascript"
            theme="vs-dark"
            :options="editorOptions"
            class="min-h-[200px]"
          />
          <div>
            <PrimeButton
              label="Copy to Clipboard"
              @click="handleCopyDefaultTagCode"
            />
          </div>
          <b>Pre-loading Tag:</b>
          <p>
            If you're using Content Security Policy settings preventing the use of inline JavaScript
            then place this tag just before the enclosing BODY tag. This script executes before the
            load event has fired.
          </p>
          <vue-monaco-editor
            v-model:value="preLoadingTagCode"
            language="javascript"
            theme="vs-dark"
            :options="editorOptions"
            class="min-h-[40px]"
          />
          <div>
            <PrimeButton
              label="Copy to Clipboard"
              @click="handleCopyPreLoadingTagCode"
            />
          </div>
        </div>
      </template>
    </SingleBlock>
  </div>
</template>

<script>
  import SingleBlock from '@/templates/single-block'
  import PrimeButton from 'primevue/button'

  const defaultTagCode = `<script>
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('load', function() {
        if (window.azpulse === undefined) {
          var pulse = document.createElement('script');
          pulse.src = '//client.azionrum.net/8900e/azion-pulse.js';
          document.body.appendChild(pulse);
        }
      })
    }
  <${'/'}script>`

  const editorOptions = {
    minimap: {
      enabled: false
    },
    readOnly: true,
    scrollBeyondLastLine: false
  }

  const preLoadingTagCode = `<script async src="//client.azionrum.net/8900e/azion-pulse.js"><${'/'}script>`

  export default {
    name: 'edge-pulse-view',
    components: {
      PrimeButton,
      SingleBlock
    },
    methods: {
      showToast() {
        this.$toast.add({
          closable: false,
          severity: 'success',
          summary: 'Code successfully copied',
          life: 1000
        })
      },
      handleCopyDefaultTagCode() {
        navigator.clipboard.writeText(defaultTagCode).then(this.showToast)
      },
      handleCopyPreLoadingTagCode() {
        navigator.clipboard.writeText(preLoadingTagCode).then(this.showToast)
      }
    },
    data() {
      return {
        defaultTagCode,
        preLoadingTagCode,
        editorOptions
      }
    }
  }
</script>
