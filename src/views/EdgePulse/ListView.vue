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
            description="The script executes before the load event is fired. Recommended when using Content Security Policy settings that prevent the use of inline JavaScript."
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
                  label="Copy"
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
