<template>
  <div
    v-if="isVisible"
    class="border surface-border rounded-md surface-section flex flex-col relative"
  >
    <PrimeButton
      v-if="communication.dismissible"
      icon="pi pi-times"
      severity="secondary"
      text
      rounded
      class="absolute top-3 right-3 z-1"
      @click="handleDismiss"
    />
    <div class="flex flex-col">
      <div
        v-if="communication.image"
        class="flex justify-center p-6"
      >
        <img
          :src="communication.image"
          alt="Communication image"
          class="max-h-40 object-contain"
        />
      </div>

      <div class="flex flex-col w-full">
        <span
          v-if="communication.tag"
          class="text-[10px] font-mono uppercase tracking-wider text-color-secondary border-y surface-border py-3 font-medium px-6"
        >
          {{ communication.tag }}
        </span>

        <h3
          class="text-xl font-semibold var(--text-color) leading-tight px-6 py-4 surface-border border-b"
        >
          {{ communication.message }}
        </h3>
      </div>

      <div class="p-6">
        <PrimeButton
          v-if="communication.ctaText && communication.ctaHref"
          :label="communication.ctaText"
          severity="secondary"
          outlined
          class="w-full uppercase tracking-widest text-xs font-medium"
          @click="handleCtaClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { listCommunicationsService } from '@/services/appcues-services'

  defineOptions({ name: 'CommunicationsCard' })

  const STORAGE_KEY_PREFIX = 'comm_dismissed:'
  const ALLOWED_URL_PROTOCOLS = ['https:', 'http:']
  const MAX_ID_LENGTH = 128
  const MAX_MESSAGE_LENGTH = 500

  const communication = ref(null)
  const isDismissed = ref(false)
  const isLoading = ref(false)

  const isValidUrl = (url, allowedProtocols = ALLOWED_URL_PROTOCOLS) => {
    if (!url || typeof url !== 'string') return false
    try {
      const parsed = new URL(url)
      return allowedProtocols.includes(parsed.protocol)
    } catch {
      return false
    }
  }

  const sanitizeId = (id) => {
    if (!id || typeof id !== 'string') return null
    const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, MAX_ID_LENGTH)
    return sanitized.length > 0 ? sanitized : null
  }

  const sanitizeText = (text, maxLength = MAX_MESSAGE_LENGTH) => {
    if (!text || typeof text !== 'string') return ''
    return text.slice(0, maxLength)
  }

  const isVisible = computed(() => {
    if (!communication.value) return false
    if (isDismissed.value) return false
    if (!isWithinDateRange()) return false
    return true
  })

  const isWithinDateRange = () => {
    if (!communication.value) return false
    const now = new Date()

    if (communication.value.startAt) {
      const startDate = new Date(communication.value.startAt)
      if (now < startDate) return false
    }

    if (communication.value.endAt) {
      const endDate = new Date(communication.value.endAt)
      if (now > endDate) return false
    }

    return true
  }

  const checkDismissed = (id) => {
    if (!id) return false
    const dismissedAt = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`)
    return !!dismissedAt
  }

  const persistDismiss = (id) => {
    if (!id) return
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, new Date().toISOString())
  }

  const handleCtaClick = () => {
    if (communication.value?.ctaHref) {
      window.open(communication.value.ctaHref, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDismiss = () => {
    if (communication.value?.id) {
      persistDismiss(communication.value.id)
    }

    isDismissed.value = true
  }

  const validateBanner = (banner) => {
    if (!banner || typeof banner !== 'object') return false
    if (!banner.id || typeof banner.id !== 'string') return false
    if (!banner.name || typeof banner.name !== 'string') return false
    return true
  }

  const adaptBanner = (banner) => {
    const sanitizedId = sanitizeId(banner.id)
    if (!sanitizedId) return null

    return {
      id: sanitizedId,
      message: sanitizeText(banner.name),
      dismissible: true,
      tag: banner.tag ? sanitizeText(banner.tag, 100) : null,
      ctaText: banner.ctaText ? sanitizeText(banner.ctaText, 100) : null,
      ctaHref: banner.ctaHref && isValidUrl(banner.ctaHref) ? banner.ctaHref : null,
      startAt: banner.startAt || null,
      endAt: banner.endAt || null,
      image: banner.image && isValidUrl(banner.image) ? banner.image : null,
      priority: typeof banner.priority === 'number' ? banner.priority : 0
    }
  }

  const loadBanners = async () => {
    isLoading.value = true
    try {
      const banners = await listCommunicationsService()

      if (!Array.isArray(banners) || banners.length === 0) {
        return
      }

      const validBanner = banners.find((banner) => {
        if (!validateBanner(banner)) return false
        if (checkDismissed(banner.id)) return false
        return true
      })

      if (validBanner) {
        communication.value = adaptBanner(validBanner)
      }
    } catch {
      // Error loading banners - fail silently
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadBanners()
  })
</script>
