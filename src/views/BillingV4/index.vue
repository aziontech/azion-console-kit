<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Billing" />
    </template>

    <template #content>
      <SkeletonBlock
        v-if="isLoading"
        type="table"
      />

      <div
        v-else
        class="flex flex-col gap-6"
      >
        <section class="flex flex-col gap-2">
          <h2 class="text-lg font-medium">Subscription</h2>
          <p
            v-if="!subscription"
            class="text-color-secondary"
          >
            No active subscription for this account.
          </p>
          <dl
            v-else
            class="grid grid-cols-2 gap-2 max-w-xl"
          >
            <dt class="text-color-secondary">Status</dt>
            <dd>{{ subscription.status }}</dd>
            <dt class="text-color-secondary">Plan</dt>
            <dd>{{ subscription.planId ?? '—' }}</dd>
            <dt class="text-color-secondary">Pricing</dt>
            <dd>{{ subscription.planPricingId ?? '—' }}</dd>
            <dt class="text-color-secondary">Current period</dt>
            <dd>{{ subscription.currentPeriodStart }} → {{ subscription.currentPeriodEnd }}</dd>
          </dl>
        </section>

        <section class="flex flex-col gap-2">
          <h2 class="text-lg font-medium">Scheduled changes</h2>
          <p
            v-if="!scheduledChanges.length"
            class="text-color-secondary"
          >
            None scheduled.
          </p>
          <ul v-else>
            <li
              v-for="change in scheduledChanges"
              :key="change.id"
            >
              {{ change.type }} — {{ change.status }} — {{ change.effectiveAt }}
            </li>
          </ul>
        </section>

        <section class="flex flex-col gap-2">
          <h2 class="text-lg font-medium">Payment methods</h2>
          <p
            v-if="!paymentMethods.length"
            class="text-color-secondary"
          >
            No card on file.
          </p>
          <ul v-else>
            <li
              v-for="method in paymentMethods"
              :key="method.id"
            >
              {{ method.brand }} •••• {{ method.last4 }}
              <span v-if="method.isDefault">(default)</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed } from 'vue'
  import { useQuery } from '@tanstack/vue-query'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import SkeletonBlock from '@/templates/skeleton-block'
  import { subscriptionsService } from '@/services/v2/billing-api/subscriptions/subscriptions-service'
  import { paymentMethodsService } from '@/services/v2/billing-api/payment-methods/payment-methods-service'
  import { queryKeys } from '@/services/v2/base/query/queryKeys'

  defineOptions({ name: 'BillingV4Screen' })

  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscriptions.current(),
    queryFn: () => subscriptionsService.getCurrentSubscription(),
    retry: false
  })

  const subscription = computed(() => subscriptionQuery.data.value?.data ?? null)

  const scheduledChangesQuery = useQuery({
    queryKey: computed(() => queryKeys.subscriptions.scheduledChanges(subscription.value?.id)),
    queryFn: () => subscriptionsService.listScheduledChanges(subscription.value.id),
    enabled: computed(() => Boolean(subscription.value?.id))
  })

  const scheduledChanges = computed(() => scheduledChangesQuery.data.value?.results ?? [])

  const paymentMethodsQuery = useQuery({
    queryKey: queryKeys.paymentMethods.list(),
    queryFn: () => paymentMethodsService.listPaymentMethods()
  })

  const paymentMethods = computed(() => paymentMethodsQuery.data.value ?? [])

  const isLoading = computed(
    () => subscriptionQuery.isLoading.value || paymentMethodsQuery.isLoading.value
  )
</script>
