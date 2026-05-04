/**
 * Deploy Template Components
 *
 * Multi-step card system for deploy template flow.
 * Uses VERTICAL SCROLL animation pattern (NOT a horizontal carousel):
 * - Both cards exist in the DOM simultaneously (stacked vertically)
 * - On "Next" click, smooth scrolls to reveal step 2 below step 1
 * - Step 2 enters with fade + translateY animation when scrolling into view
 * - IntersectionObserver triggers the entry animation
 *
 * Components:
 * - BaseDeployCard: Base presentational card with slots (100% stateless)
 * - DeployRepositoryCard: Step 1 - Template selection and git configuration
 * - TemplateSettingsCard: Step 2 - Template settings form
 * - DeployStatusCard: Step 3 - Deploy progress, logs, and results
 * - DeploySuccessCard: Step 4 - Success confirmation with app URL and next steps
 * - TemplateInfoBlock: Reusable preview + info block component
 *
 * Note: Step orchestration is handled by layout-engine-block.vue which provides
 * VCS integration, form state management, and scroll-based navigation.
 *
 * Animation sequence on Next click:
 * 1. Step 1 remains visible at the top (does NOT disappear or slide horizontally)
 * 2. Viewport scrolls smoothly down using scrollIntoView({ behavior: 'smooth' })
 * 3. Step 2 is revealed below step 1 (already in DOM from start)
 * 4. IntersectionObserver detects step 2 entering viewport
 * 5. Step 2 animates: opacity 0→1, translateY(24px)→translateY(0) over 400ms
 *
 * Key Restrictions:
 * - Do NOT use <Transition mode="out-in"> - that would be a carousel, not scroll
 * - Both cards MUST exist in DOM simultaneously - scroll is real, not simulated
 * - Step 2 starts with opacity: 0, animates when IntersectionObserver detects it
 * - Use scrollIntoView({ behavior: 'smooth' }) - no external scroll libraries
 * - BaseDeployCard is 100% presentational - no state, no business logic
 * - Responsive: on mobile, both cards occupy full width, scroll behavior identical
 */
export { default as BaseDeployCard } from './BaseDeployCard.vue'
export { default as DeployRepositoryCard } from './DeployRepositoryCard.vue'
export { default as TemplateSettingsCard } from './TemplateSettingsCard.vue'
export { default as DeployStatusCard } from './DeployStatusCard.vue'
export { default as DeploySuccessCard } from './DeploySuccessCard.vue'
export { default as TemplateInfoBlock } from './TemplateInfoBlock.vue'
