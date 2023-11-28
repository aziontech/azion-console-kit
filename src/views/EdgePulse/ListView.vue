<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Pulse"></PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :active-index="0"
        class="w-full grow flex flex-col gap-8"
      >
        <!-- Default -->
        <TabPanel header="Default Tag">
          <FormHorizontal
            title="Default Tag"
            description="The script waits until the loading event is completed before downloading and running the RUM Client. The loading event isn’t interrupted and doesn’t affect the user experience."
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
                  label="Copy"
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
    </template>
  </ContentBlock>
</template>

<script>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { clipboardWrite } from '@/helpers'
  import PrimeButton from 'primevue/button'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import { useAccountStore } from '@/stores/account'
  import { mapState } from 'pinia'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

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
      TabPanel,
      ContentBlock
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
          summary: 'Copied successfully!',
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
