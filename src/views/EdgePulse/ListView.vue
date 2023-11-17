<template>
  <div>
    <PageHeadingBlock pageTitle="Edge Pulse" />
    <TabView
      :active-index="0"
      class="w-full grow px-8 flex flex-col gap-8 mb-8 max-md:px-3"
    >
      <!-- Default -->
      <TabPanel header="Default Tag">
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
              :theme="theme"
              :options="editorOptions"
              class="min-h-[200px] overflow-clip surface-border border rounded-md"
            />
            <div>
              <PrimeButton
                label="Copy to Clipboard"
                icon="pi pi-copy"
                class="max-md:w-full"
                @click="handleCopyDefaultTagCode"
                outlined
              />
            </div>
          </template>
        </FormHorizontal>
      </TabPanel>

      <!-- Pre-loading -->
      <TabPanel header="Pre-loading Tag">
        <div class="w-full">
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
                :theme="theme"
                :options="editorOptions"
                class="min-h-[56px] surface-border overflow-clip border rounded-md"
              />
              <div>
                <PrimeButton
                  icon="pi pi-copy"
                  label="Copy to Clipboard"
                  class="max-md:w-full"
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
  import { useAccountStore } from '@/stores/account'
  import { mapState } from 'pinia'

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
    computed: {
      ...mapState(useAccountStore, ['currentTheme']),
      theme() {
        return this.currentTheme === 'light' ? 'vs' : 'vs-dark'
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
