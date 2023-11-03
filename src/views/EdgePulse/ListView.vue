<template>
  <div>
    <PageHeadingBlock pageTitle="Edge Pulse" />
    <TabView
      :active-index="0"
      class="w-full grow py-4 px-8 flex flex-col gap-8 mb-5"
    >
      <!-- Default -->
      <TabPanel header="Default Tag">
        <div class="w-full mb-5">
          <FormHorizontal
            title="Default Tag"
            description="Place this tag in the HTML of the switched pages to measure them. You should place it
                  just before the closing BODY tag. This script waits until the load event is complete
                  before downloading and executing the RUM Client, ensuring that the load event is
                  uninterrupted and has zero impact on user experience."
          >
            <template #inputs>
              <vue-monaco-editor
                v-model:value="defaultTagCode"
                language="javascript"
                theme="vs"
                :options="editorOptions"
                class="min-h-[200px] surface-border border rounded-md"
              />
              <div>
                <PrimeButton
                  label="Copy to Clipboard"
                  icon="pi pi-copy"
                  @click="handleCopyDefaultTagCode"
                  outlined
                />
              </div>
            </template>
          </FormHorizontal>
        </div>
      </TabPanel>

      <!-- Pre-loading -->
      <TabPanel header="Pre-loading Tag">
        <div class="w-full mb-5">
          <FormHorizontal
            title="Pre-loading Tag"
            description="If you're using Content Security Policy settings preventing the use of inline JavaScript
            then place this tag just before the enclosing BODY tag. This script executes before the
            load event has fired."
          >
            <template #inputs>
              <vue-monaco-editor
                v-model:value="preLoadingTagCode"
                language="javascript"
                theme="vs"
                :options="editorOptions"
                class="min-h-[200px] surface-border border rounded-md"
              />
              <div>
                <PrimeButton
                  icon="pi pi-copy"
                  label="Copy to Clipboard"
                  outlined
                  @click="handleCopyPreLoadingTagCode"
                />
              </div>
            </template>
          </FormHorizontal>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { clipboardWrite } from '@/helpers'
  import PrimeButton from 'primevue/button'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'

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

  const preLoadingTagCode = `<script async src="//client.azionrum.net/8900e/azion-pulse.js"><${'/'}script>`

  export default {
    components: {
      FormHorizontal,
      PageHeadingBlock,
      PrimeButton,
      TabView,
      TabPanel
    },
    data() {
      return {
        defaultTagCode,
        preLoadingTagCode,
        editorOptions: {
          minimap: { enabled: false },
          readOnly: true,
          scrollBeyondLastLine: false
        }
      }
    },
    methods: {
      showToast() {
        this.$toast.add({
          closable: false,
          severity: 'success',
          summary: 'Code successfully copied',
          life: 6000
        })
      },
      handleCopyDefaultTagCode() {
        clipboardWrite(defaultTagCode)
        this.showToast()
      },
      handleCopyPreLoadingTagCode() {
        clipboardWrite(preLoadingTagCode)
        this.showToast()
      }
    }
  }
</script>
