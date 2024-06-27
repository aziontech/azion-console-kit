<template>
  <div
    :style="{ 'background-color': 'var(--surface-section)' }"
    class="hidden flex-col w-full surface-border border-l h-[100ldh] transform translate-x-full transition-transform duration-300 ease-in-out sm:w-[500px] 2xl:w-[800px]"
  >
    <AskAzionHeader>
      <template #header-actions
        ><PrimeButton
          icon="pi pi-times"
          outlined
          class="surface-border h-8 w-8"
          aria-label="Cancel"
          @click="askAzionAiChatStore.close()"
      /></template>
    </AskAzionHeader>

    <div class="h-full flex justify-between flex-col">
      <deep-chat
        :stream="true"
        :initialMessages="initialMessages"
        :chatStyle="deepChatStyles"
        :messageStyles="messageStyles"
        :avatars="avatarStyles"
        :textInput="textInputStyles"
        :submitButtonStyles="submitButtonStyles"
        :request="makeRequestConfig()"
        :requestInterceptor="
          (requestDetails) =>
            requestInterceptorService(requestDetails, {
              sessionId: aiAskAzionSessionId,
              url: currentRouteFullPath
            })
        "
      >
      </deep-chat>
    </div>
    <Sidebar
      :visible="isChatAiOpen"
      position="bottom"
      headerContent="Ask Azion"
      :show-close-icon="false"
      :pt="{
        root: { class: '!h-[100%] md:hidden flex' },
        headerContent: { class: 'w-full' },
        mask: { class: 'md:hidden flex' },
        content: { class: '!p-0' }
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2>Azion Ask</h2>
          <PrimeButton
            icon="pi pi-times"
            @click="askAzionAiChatStore.close()"
            size="small"
            class="flex-none surface-border text-sm w-8 h-8"
            text
          />
        </div>
      </template>

      <div class="h-full w-full justify-between flex flex-col">
        <deep-chat
          :initialMessages="initialMessages"
          :chatStyle="deepChatStyles"
          :messageStyles="messageStyles"
          :avatars="avatarStyles"
          :textInput="textInputStyles"
          :submitButtonStyles="submitButtonStyles"
          :request="makeRequestConfig()"
          :stream="true"
          :requestInterceptor="
            (requestDetails) =>
              requestInterceptorService(requestDetails, {
                sessionId: aiAskAzionSessionId,
                url: currentRouteFullPath
              })
          "
        >
        </deep-chat>
      </div>
    </Sidebar>
  </div>

  <!-- Ask Azion mobile -->
</template>

<script setup>
  import Sidebar from 'primevue/sidebar'
  import PrimeButton from 'primevue/button'
  import AskAzionHeader from './ask-azion-header.vue'
  import 'deep-chat'
  import { requestInterceptorService } from './services/requestInterceptorService'
  import { makeRequestConfig } from './services/makeRequestConfig'
  import { makeSessionId } from './services/makeSessionId'
  import azionLogoProfile from '@/modules/ask-azion/assets/azion-logo.svg?url'
  import { useAskAzionAiChatStore } from '@/stores/ask-azion-ai-chat'
  import { computed, onMounted, ref } from 'vue'
  import hljs from 'highlight.js'
  import { useRouter } from 'vue-router'
  const { currentRoute } = useRouter()

  defineOptions({
    name: 'ai-chat-block'
  })

  onMounted(() => {
    addSupportToHljs()
    generateChatSessionId()
  })

  const askAzionAiChatStore = useAskAzionAiChatStore()

  const currentRouteFullPath = currentRoute.value.path
  const aiAskAzionSessionId = ref('')

  const deepChatStyles = ref({
    fontFamily: 'var(--font-family)',
    width: '100%',
    height: 'calc(100svh - 113px)',
    position: 'sticky',
    top: '56px',
    backgroundColor: 'var(--surface-section)',
    border: '1px solid var(--surface-border)',
    overflow: 'hidden'
  })

  const messageStyles = ref({
    default: {
      shared: {
        bubble: {
          color: 'var(--text-color)',
          width: '100%',
          overscrollBehavior: 'none',
          maxWidth: '100%',
          marginTop: '12px',
          marginBottom: '12px',
          marginLeft: '12px',
          overflow: 'hidden'
        }
      },
      user: {
        bubble: {
          backgroundColor: 'var(--surface-400)'
        },
        outerContainer: {
          backgroundColor: 'var(--surface-400)'
        }
      },
      ai: {
        bubble: {
          backgroundColor: 'var(--surface-200)'
        },
        outerContainer: {
          backgroundColor: 'var(--surface-200)',
          borderTop: '1px solid var(--surface-0)',
          borderBottom: '1px solid var(--border)'
        }
      }
    }
  })
  const textInputStyles = ref({
    styles: {
      text: { color: `var(--text-color)` },
      container: {
        width: '100%',
        height: '4rem',
        border: '1px solid var(--surface-400)',
        backgroundColor: 'var(--surface-section)',
        boxShadow: 'none',
        size: 22,
        margin: '16px'
      },
      focus: {
        outline: '0 none',
        outlineOffset: 0,
        boxShadow: '0 0 0 0.2rem rgba(243, 100, 43, 0.6235294118)',
        borderColor: '#f3652b',
        transition: 'all 0.2s ease-in-out'
      }
    },
    placeholder: { text: 'Hi, what can I help you with?', style: { color: 'var(--text-color)' } },
    characterLimit: 300
  })
  const avatarStyles = ref({
    default: { styles: { position: 'left' } },
    ai: { src: azionLogoProfile }
  })
  const submitButtonStyles = ref({
    submit: {
      container: {
        default: { width: '24px', height: '24px', bottom: '20px', right: '20px' }
      }
    }
  })

  const createSuggestion = ({ title, text }) => {
    return `
      <div class="flex flex-col gap-2 mb-4 deep-chat-suggestion ">
        <p>${title}</p>
        <button style="text-align: left; min-height:4rem;transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s; border-radius: 6px; font-weight: 500;cursor: pointer; background-color: transparent; border: 1px solid var(--surface-border); color: var(--text-color); font-size: 0.875rem; padding: 0.301rem 0.65625rem; overscroll-behavior: contain; width: auto;" class="deep-chat-suggestion-button">
            ${text}
        </button>
      </div>
    `
  }

  const initialMessages = ref([
    {
      html: '<p>Ask Azion is in experimental mode and can give you some wrong answers. Please, always validate your answers.</p>',
      role: 'ai-notification'
    },
    {
      html: `
      <style> @import url('src/assets/main.css')</style>
      <style>
        #chat-view #messages{
          overscroll-behavior:none
        }

        #messages  a{
          color: var(--text-color-link) !important;
          text-decoration: underline;
          font-weight: 500;
        }

        #chat-view .avatar{
          width:1rem;
        }
        .deep-chat-suggestion-button:hover {
          border-color:var(--text-color) !important;
        }
      </style>


      <div style="display:flex;flex-direction:column;gap:12px" class="deep-chat-temporary-message">
        ${createSuggestion({
          title: 'I have a question about WAF',
          text: 'I have a problem with my WAF configuration, can you help me set it up and test it?'
        })}

        ${createSuggestion({
          title: 'Deploy your first application',
          text: 'I want to know how to deploy and application at Azion'
        })}

        ${createSuggestion({
          title: 'Learn how to use our API V4',
          text: 'I want to know how to use the API or CLI'
        })}

        ${createSuggestion({
          title: 'How to use Azion to pointing my traffic',
          text: 'I want to know how to point my traffic to Azion'
        })}
      </div>
      `,
      role: 'ai'
    }
  ])

  const isChatAiOpen = computed(() => {
    return askAzionAiChatStore.isOpen
  })

  const addSupportToHljs = () => {
    if (!window.hljs) {
      window.hljs = hljs
    }
  }

  const generateChatSessionId = () => {
    aiAskAzionSessionId.value = makeSessionId()
  }
</script>
./services/makeRequestConfig
