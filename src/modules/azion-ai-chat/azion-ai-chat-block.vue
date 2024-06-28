<template>
  <deep-chat
    :stream="true"
    ref="deepChatRef"
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
    <div></div>
  </deep-chat>
</template>
<script setup>
  import 'deep-chat'
  import { requestInterceptorService } from './services/requestInterceptorService'
  import { makeRequestConfig } from './services/makeRequestConfig'
  import { makeSessionId } from './services/makeSessionId'
  import azionLogoProfile from '@/modules/azion-ai-chat/assets/azion-logo.svg?url'
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  const { currentRoute } = useRouter()

  defineOptions({
    name: 'azion-ai-chat-block'
  })

  onMounted(() => {
    generateChatSessionId()
  })

  const deepChatRef = ref(null)
  defineExpose({
    deepChatRef
  })

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
          width: 'auto',
          overscrollBehavior: 'none',
          maxWidth: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--surface-200)'
        },
        outerContainer: {
          marginTop: '24px'
        }
      },
      user: {
        bubble: {
          padding: '12px 16px',
          backgroundColor: 'var(--surface-300)'
        },
        outerContainer: {}
      },
      ai: {
        bubble: {
          backgroundColor: 'transparent'
        }
      },
      notification: {
        bubble: {
          width: '100%',
          marginLeft: '-10px'
        }
      },
      loading: {
        bubble: { backgroundColor: 'var(--surface-200)' }
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
    placeholder: {
      text: 'Message Azion AI',
      style: { color: 'var(--text-color)' }
    },
    characterLimit: 300
  })
  const avatarStyles = ref({
    default: {
      styles: { position: 'left' }
    },
    user: {
      styles: {
        position: 'right',
        avatar: {
          display: 'none'
        }
      }
    },
    ai: {
      src: azionLogoProfile,
      styles: {
        position: 'left',
        avatar: {
          minWidth: '32px',
          minHeight: '32px',
          width: '32px',
          height: '32px'
        }
      }
    },
    notification: {
      styles: {
        avatar: {
          display: 'none',
          width: '32px',
          height: '32px'
        }
      }
    }
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
      <div class="deep-chat-suggestion flex flex-col gap-2 mb-2">
        <p>${title}</p>
        <button style="text-align: left; min-height:2rem;transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s; border-radius: 6px; font-weight: 500;cursor: pointer; background-color: transparent; border: 1px solid var(--surface-border); color: var(--text-color); font-size: 0.875rem; padding: 0.5rem 1rem; overscroll-behavior: contain; width: auto;" class="deep-chat-suggestion-button">
            ${text}
        </button>
      </div>
    `
  }

  const initialMessages = ref([
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

      </div>
      `,
      role: 'ai'
    }
  ])
  const generateChatSessionId = () => {
    aiAskAzionSessionId.value = makeSessionId()
  }
</script>
