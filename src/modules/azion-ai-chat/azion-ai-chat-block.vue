<template>
  <div
    class="flex flex-col w-full h-full"
    :key="resetKey"
  >
    <deep-chat
      :stream="true"
      ref="deepChatRef"
      :errorMessages="errorMessages"
      :chatStyle="deepChatStyles"
      :messageStyles="messageStyles"
      :avatars="avatarStyles"
      :textInput="textInputStyles"
      :submitButtonStyles="submitButtonStyles"
      :request="DEEP_CHAT_CONFIG_REQUEST"
      :requestInterceptor="interceptor"
      :responseInterceptor="responseInterceptorService"
      :images="imageReset"
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
    <small class="text-xs text-color-secondary font-normal leading-5 text-center mb-2 mx-2">
      Azion Copilot may make mistakes. Consider verifying important information.
    </small>
  </div>
</template>
<script setup>
  import 'deep-chat'
  import introMessageAiAzionLogo from './assets/intro-message-logo.svg?url'
  import suggestionIconMetrics from './assets/suggestion-icon-metrics.svg?url'
  import suggestionIconSecurity from './assets/suggestion-icon-security.svg?url'
  import AzionAiChatSuggestion from './azion-ai-chat-suggestion.vue'
  import {
    requestInterceptorService,
    responseInterceptorService
  } from './services/interceptor-service'
  import { loadPromptSuggestion } from './services/load-prompt-suggestions'
  import { makeSessionId } from './services/make-session-id'
  import azionLogoProfile from '@/modules/azion-ai-chat/assets/azion-logo.svg?url'
  import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import hljs from 'highlight.js'
  import { AZION_MESSAGE_TYPE } from '@modules/azion-ai-chat/directives/custom-ai-prompt'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { getEnvironment } from '@/helpers'

  defineOptions({
    name: 'azion-ai-chat-block'
  })

  const props = defineProps({
    insertDeepChatStyles: {
      type: Object,
      default: () => ({})
    }
  })

  const { currentRoute } = useRouter()
  const azionAiChatStore = useAzionAiChatStore()
  const accountStore = ref(null)
  const deepChatRef = ref(null)
  const environment = getEnvironment()
  const DEEP_CHAT_CONFIG_REQUEST = {
    url: `https://${
      environment === 'production' ? '' : 'stage-'
    }ai.azion.com/copilot/chat/completions`,
    credentials: 'include'
  }
  const aiAskAzionSessionId = ref('')
  const promptOrigin = ref(null)
  const errorMessages = ref({
    overrides: {
      default: 'Connection failed. Try sending your message again.'
    }
  })
  const deepChatStyles = ref({
    fontFamily: 'var(--font-family)',
    width: '100%',
    height: 'calc(95svh - 113px)',
    position: 'sticky',
    backgroundColor: 'var(--surface-section)',
    border: '0',
    overflow: 'hidden',
    ...props.insertDeepChatStyles
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
        margin: '16px 16px 10px',
        maxWidth: '640px'
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
    characterLimit: 16000
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
          right: '28px',
          margin: '0'
        }
      }
    }
  })
  const imageReset = ref({
    button: {
      position: 'outside-left',
      styles: {
        container: {
          default: {
            width: '24px',
            height: '24px',
            position: 'relative',
            backgroundColor: 'rgb(243, 101, 43)',
            left: '0px',
            bottom: '0',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            marginTop: '18px'
          }
        },
        svg: {
          content: `
            <svg width="28" height="30" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.7256 1.48845C11.809 1.40481 11.961 1.33985 12.1567 1.34424C12.3525 1.34864 12.519 1.42163 12.6147 1.51749C12.7177 1.62063 12.7919 1.78951 12.7994 1.97731C12.8069 2.16427 12.7472 2.30773 12.6657 2.38956L6.67358 8.38942L5.65526 8.48198L5.73542 7.48638L11.7256 1.48845Z
                M13.464 0.669678C13.1142 0.319317 12.6343 0.154669 12.1837 0.144541C11.7329 0.134413 11.2384 0.278013 10.8764 0.64055L4.73051 6.79438C4.62991 6.8951 4.56841 7.02838 4.55698 7.1703L4.40199 9.09591C4.38779 9.27231 4.4522 9.44599 4.57799 9.57047C4.70379 9.69503 4.87813 9.75759 5.05438 9.74159L6.99878 9.56479C7.1387 9.55207 7.26974 9.49063 7.36902 9.39127L13.5149 3.23739C13.8788 2.87246 14.0165 2.37887 13.9985 1.92929C13.9805 1.48043 13.8065 1.01277 13.464 0.669678Z
                M2.04964 1.34453C0.920763 1.34453 -0.000366211 2.26566 -0.000366211 3.39453V12.0945C-0.000366211 13.2234 0.920763 14.1446 2.04964 14.1446H10.7497C11.8785 14.1446 12.7997 13.2234 12.7997 12.0945V7.74454C12.7997 7.41318 12.531 7.14454 12.1997 7.14454C11.8683 7.14454 11.5997 7.41318 11.5997 7.74454V12.0945C11.5997 12.5607 11.2157 12.9446 10.7497 12.9446H2.04964C1.58351 12.9446 1.19964 12.5607 1.19964 12.0945V3.39453C1.19964 2.9284 1.58351 2.54453 2.04964 2.54453H6.39966C6.73102 2.54453 6.99966 2.2759 6.99966 1.94453C6.99966 1.61316 6.73102 1.34453 6.39966 1.34453H2.04964Z"
                fill="white"
              />
            </svg>
          `
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
  const resetKey = ref(0)

  const handleSubmitSuggestion = (promptText) => {
    deepChatRef.value.submitUserMessage({ text: promptText })
  }

  const generateChatSessionId = () => {
    aiAskAzionSessionId.value = makeSessionId()
  }

  const submitUserMessageGetHelp = ({ user, system }) => {
    promptOrigin.value = {
      user_prompt: user,
      system_prompt: system
    }
    deepChatRef.value.submitUserMessage({ text: user })
  }

  const calculateIconBySuggestionIndex = (index) => {
    return index === 0 ? suggestionIconMetrics : suggestionIconSecurity
  }

  const interceptor = (requestDetails) => {
    const allMessage = deepChatRef.value.getMessages()

    requestInterceptorService(requestDetails, {
      sessionId: aiAskAzionSessionId.value,
      url: currentRoute.value.path,
      userName: accountStore.value.name,
      clientId: accountStore.value.client_id,
      prompt: promptOrigin.value,
      allMessage
    })
  }

  const loadPromptSuggestionWithRoleDecorator = (role) => {
    suggestionsOptions.value = loadPromptSuggestion(role)
  }

  watchEffect(() => {
    const { account } = useAccountStore()

    accountStore.value = account

    loadPromptSuggestionWithRoleDecorator(accountStore.value.jobRole)
  })

  const clearMessages = () => {
    deepChatRef.value.clearMessages()
    promptOrigin.value = null
  }

  const insertButton = () => {
    const hostSelector = 'deep-chat'
    const targetSelector = '#chat-view #input'
    const shadowHost = document.querySelector(hostSelector)

    let observer = null
    let buttonObserver = null

    const disconnectObservers = () => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (buttonObserver) {
        buttonObserver.disconnect()
        buttonObserver = null
      }
    }

    const monitorButtonRemoval = (targetElement, button) => {
      buttonObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if ([...mutation.removedNodes].includes(button)) {
            disconnectObservers()
            startObserving()
          }
        })
      })

      buttonObserver.observe(targetElement, { childList: true })
    }

    const removeExistingButton = (targetElement) => {
      const buttonToRemove = targetElement.querySelector(
        '.input-button-container.outer-button-container.text-input-container-left-small-adjustment'
      )

      if (buttonToRemove) {
        buttonToRemove.remove()
      }
      return !targetElement.querySelector(
        '.input-button-container.outer-button-container.text-input-container-left-small-adjustment'
      )
    }

    const createNewButton = (targetElement) => {
      const newElement = document.createElement('div')
      newElement.className = 'input-button-customer-azion input-button'
      newElement.title = 'New chat'
      targetElement.style.alignItems = 'flex-end'
      Object.assign(newElement.style, {
        width: '24px',
        height: '24px',
        position: 'relative',
        backgroundColor: 'rgb(243, 101, 43)',
        left: '0px',
        bottom: '0px',
        padding: '0.4rem',
        display: 'flex',
        alignItems: 'center',
        margin: '0px 0px 10px 16px'
      })

      newElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="30" viewBox="0 0 14 15" fill="none">
        <path fill-rule="evenodd" clip-rule="evenodd" 
              d="M11.7256 1.48845C11.809 1.40481 11.961 1.33985 12.1567 1.34424C12.3525 1.34864 12.519 1.42163 12.6147 1.51749C12.7177 1.62063 12.7919 1.78951 12.7994 1.97731C12.8069 2.16427 12.7472 2.30773 12.6657 2.38956L6.67358 8.38942L5.65526 8.48198L5.73542 7.48638L11.7256 1.48845Z 
                 M13.464 0.669678C13.1142 0.319317 12.6343 0.154669 12.1837 0.144541C11.7329 0.134413 11.2384 0.278013 10.8764 0.64055L4.73051 6.79438C4.62991 6.8951 4.56841 7.02838 4.55698 7.1703L4.40199 9.09591C4.38779 9.27231 4.4522 9.44599 4.57799 9.57047C4.70379 9.69503 4.87813 9.75759 5.05438 9.74159L6.99878 9.56479C7.1387 9.55207 7.26974 9.49063 7.36902 9.39127L13.5149 3.23739C13.8788 2.87246 14.0165 2.37887 13.9985 1.92929C13.9805 1.48043 13.8065 1.01277 13.464 0.669678Z 
                 M2.04964 1.34453C0.920763 1.34453 -0.000366211 2.26566 -0.000366211 3.39453V12.0945C-0.000366211 13.2234 0.920763 14.1446 2.04964 14.1446H10.7497C11.8785 14.1446 12.7997 13.2234 12.7997 12.0945V7.74454C12.7997 7.41318 12.531 7.14454 12.1997 7.14454C11.8683 7.14454 11.5997 7.41318 11.5997 7.74454V12.0945C11.5997 12.5607 11.2157 12.9446 10.7497 12.9446H2.04964C1.58351 12.9446 1.19964 12.5607 1.19964 12.0945V3.39453C1.19964 2.9284 1.58351 2.54453 2.04964 2.54453H6.39966C6.73102 2.54453 6.99966 2.2759 6.99966 1.94453C6.99966 1.61316 6.73102 1.34453 6.39966 1.34453H2.04964Z" fill="white"></path>
      </svg>`

      targetElement.prepend(newElement)

      newElement.addEventListener(
        'click',
        (event) => {
          event.stopImmediatePropagation()
          resetComponent()
        },
        true
      )

      return newElement
    }

    const addButton = () => {
      const targetElement = shadowHost.shadowRoot.querySelector(targetSelector)

      if (targetElement && !targetElement.querySelector('.input-button-customer-azion')) {
        if (removeExistingButton(targetElement)) {
          const newButton = createNewButton(targetElement)
          monitorButtonRemoval(targetElement, newButton)
        }
      }
    }

    const startObserving = () => {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (!mutation.addedNodes.length) return
          addButton()
        })
      })

      observer.observe(shadowHost.shadowRoot, {
        childList: true,
        subtree: true
      })
    }

    if (shadowHost) {
      disconnectObservers()
      startObserving()
      addButton()
    }
  }

  const addSupportToHljs = () => {
    if (!window.hljs) {
      window.hljs = hljs
    }
  }

  const resetComponent = () => {
    resetKey.value++
    setTimeout(() => {
      insertButton()
    }, 100)
  }

  onUnmounted(() => {
    window.removeEventListener('message', aiCustomPromptListenerHandler)
  })

  const aiCustomPromptListenerHandler = (event) => {
    setTimeout(() => {
      if (event.data.type === AZION_MESSAGE_TYPE) {
        resetComponent()
        azionAiChatStore.open()
        deepChatRef?.value?.submitUserMessageGetHelp(event.data.prompt)
      }
    }, 100)
  }

  onMounted(() => {
    window.addEventListener('message', aiCustomPromptListenerHandler)
    generateChatSessionId()
    insertButton()
    addSupportToHljs()
  })

  defineExpose({
    deepChatRef,
    clearMessages,
    resetComponent,
    submitUserMessageGetHelp
  })
</script>
