<template>
  <deep-chat
    :stream="true"
    ref="deepChatRef"
    :errorMessages="errorMessages"
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
          url: currentRouteFullPath,
          userName: account.name
        })
    "
  >
    <div class="deep-chat-temporary-message">
      <div :style="`display:flex;align-items:center;flex-direction:column;gap:2rem;`">
        <img
          :style="`width:32px;height:32px;object-fit:cover;`"
          :src="introMessageAiAzionLogo"
        />
        <div
          :style="`display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;gap:1rem`"
        >
          <AzionAiChatSuggestion
            v-for="(suggestionOption, suggestionIndex) in suggestionsOptions"
            :key="suggestionIndex"
            @click="handleSubmitSuggestion(suggestionOption.prompt)"
            :text="suggestionOption.title"
            :iconSrc="calculateIconBySuggestionIndex(suggestionIndex)"
          />
        </div>
      </div>
      <div v-html="introMessageWithResetStyles.html" />
    </div>
  </deep-chat>
</template>
<script setup>
  import 'deep-chat'
  import introMessageAiAzionLogo from './assets/intro-message-logo.svg?url'
  import suggestionIconMetrics from './assets/suggestion-icon-metrics.svg?url'
  import suggestionIconSecurity from './assets/suggestion-icon-security.svg?url'
  import AzionAiChatSuggestion from './azion-ai-chat-suggestion.vue'
  import { requestInterceptorService } from './services/request-interceptor-service'
  import { loadPromptSuggestion } from './services/load-prompt-suggestions'
  import { makeRequestConfig } from './services/make-request-config'
  import { makeSessionId } from './services/make-session-id'
  import azionLogoProfile from '@/modules/azion-ai-chat/assets/azion-logo.svg?url'
  import { onMounted, ref, watchEffect } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  const { currentRoute } = useRouter()
  const { account } = useAccountStore()

  defineOptions({
    name: 'azion-ai-chat-block'
  })

  onMounted(() => {
    generateChatSessionId()
    getUserNameInfo()
  })

  const deepChatRef = ref(null)

  defineExpose({
    deepChatRef
  })

  const currentRouteFullPath = currentRoute.value.path
  const aiAskAzionSessionId = ref('')
  const accountName = ref('')

  const errorMessages = ref({
    overrides: {
      default: 'Connection failed. Try sending your message again.'
    }
  })
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
    },
    error: {
      bubble: {
        color: 'var(--text-color)',
        backgroundColor: 'var(--surface-200)'
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
        padding: '5.5px 8px',
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
      text: 'Ask Copilot for help',
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
          bottom: '20px',
          right: '26px',
          margin: '0'
        }
      },
      svg: {
        styles: {
          default: {
            color: 'var(--text-color) !important',
            filter: 'unset !important'
          }
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
          bottom: '22px',
          right: '28px',
          margin: '0'
        }
      }
    }
  })
  const introMessageWithResetStyles = ref({
    html: `
      <style>
        #chat-view{
          font-size:16px;
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
      `,
    role: 'ai'
  })
  const suggestionsOptions = ref([])

  const handleSubmitSuggestion = (promptText) => {
    deepChatRef.value.submitUserMessage({ text: promptText })
  }
  const generateChatSessionId = () => {
    aiAskAzionSessionId.value = makeSessionId()
  }
  const getUserNameInfo = () => {
    accountName.value = account.name
  }

  const calculateIconBySuggestionIndex = (index) => {
    return index === 0 ? suggestionIconMetrics : suggestionIconSecurity
  }

  const loadPromptSuggestionWithRoleDecorator = (role) => {
    suggestionsOptions.value = loadPromptSuggestion(role)
  }

  watchEffect(() => {
    const {
      account: { jobRole }
    } = useAccountStore()

    loadPromptSuggestionWithRoleDecorator(jobRole)
  })
</script>
