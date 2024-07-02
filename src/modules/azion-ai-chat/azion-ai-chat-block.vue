<template>
  <deep-chat
    :stream="true"
    ref="deepChatRef"
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
    <div
      class="deep-chat-temporary-message"
      :style="`display:flex;align-items:center;flex-direction:column;gap:2rem;`"
    >
      <img
        :style="`width:32px;height:32px;object-fit:cover;`"
        :src="introMessageAiAzionLogo"
      />
      <div v-html="introMessage.html"></div>
    </div>
  </deep-chat>
</template>
<script setup>
  import 'deep-chat'
  import introMessageAiAzionLogo from './assets/intro-message-logo.svg?url'
  import { requestInterceptorService } from './services/request-interceptor-service'
  import { makeRequestConfig } from './services/make-request-config'
  import { makeSessionId } from './services/make-session-id'
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
  const textInputStyles = ref({
    styles: {
      text: { color: `var(--text-color)` },
      container: {
        width: '100%',
        height: 'auto',
        padding: '16px',
        fontSize: '14px',
        boxSizing: 'border-box',
        border: '1px solid var(--surface-400)',
        backgroundColor: 'var(--surface-section)',
        boxShadow: 'none',
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

  const submitButtonStyles = ref({
    position: 'inside-right',
    submit: {
      container: {
        default: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          objectFit: 'cover',
          width: '32px',
          height: '32px',
          bottom: '30px',
          right: '36px',
          margin: '0'
        }
      }
    },
    loading: {
      container: {
        default: {
          display: 'none'
        }
      }
    },
    stop: {
      container: {
        default: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          objectFit: 'cover',
          width: '28px',
          height: '28px',
          bottom: '32px',
          right: '36px',
          margin: '0'
        }
      }
    }
  })

  const createSuggestion = ({ text }) => {
    return `
      <div class="deep-chat-suggestion">
        <button style="text-align: left; min-height:2rem;transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s; border-radius: 6px; font-weight: 500;cursor: pointer; background-color: transparent; border: 1px solid var(--surface-border); color: var(--text-color); font-size: 0.875rem; padding: 0.5rem 1rem; overscroll-behavior: contain; width: auto;" class="deep-chat-suggestion-button">
            ${text}
        </button>
      </div>
    `
  }

  const introMessage = ref({
    html: `
      <style>
        #chat-view{
          font-size:16px;
        }
        #chat-view #messages{
          overscroll-behavior:none;
        }
        #messages p{
          tab-size: 4;
          font-feature-settings: normal;
          font-variation-settings: normal;
          box-sizing: border-box;
          color: var(--text-color) !important;
        }

        #messages ul, 
        #messages ol {
          tab-size: 4;
          font-feature-settings: normal;
          font-variation-settings: normal;
          font-size: 1rem;
          line-height: 1.75;
          border-width: 0;
          border-style: solid;
          border-color: var(--text-color);
          list-style: none;
          box-sizing: border-box;
          color: var(--text-color) !important;
          overscroll-behavior: contain !important;
          list-style-type: disc;
          margin-top: 1.25em;
          margin-bottom: 1.25em;
          padding-left: 1.625em;
        }

        #messages a{
          color: var(--text-color-link) !important;
          text-decoration: underline;
          font-weight: 500;
        }

        .deep-chat-suggestion-button:hover {
          border-color:var(--text-color) !important;
        }
      </style>

      <div style="display:flex;flex-direction:row;gap:1rem">
        ${createSuggestion({
          text: 'Show how WAF protect my application'
        })}

        ${createSuggestion({
          text: 'Customize build metrics'
        })}

      </div>
      `,
    role: 'ai'
  })

  const generateChatSessionId = () => {
    aiAskAzionSessionId.value = makeSessionId()
  }
</script>
