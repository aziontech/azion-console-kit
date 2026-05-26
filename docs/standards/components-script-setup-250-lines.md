# Standard: components-script-setup-250-lines

> applies-to: src/templates/**/*.vue, src/views/**/*.vue, src/components/**/*.vue
> enforced-by: manual review (line count) + eslint `azion-architecture/no-direct-http-in-components`
> related-specs: billing-cards-*, billing-drawer-*, billing-dialog-*

## Rule

Components MUST use `<script setup>` and stay ≤250 lines (script + template + style combined). Server data MUST come from composables, not direct service calls.

## Rationale

The 250-line cap forces decomposition: when a component grows beyond it, the right action is to extract a child component or a composable, not to keep adding logic in place. `<script setup>` is required for Composition API ergonomics and type inference.

## Examples

```vue
<!-- BAD — Options API + 400 lines -->
<script>
export default { data, computed, methods }
</script>

<!-- GOOD — script setup + composable -->
<script setup>
const { data, isLoading } = useFooList()
</script>
```

## Exceptions

- Generated files (Storybook, scaffolds) are exempt.
- A single component MAY exceed 250 lines temporarily during a refactor; spec must record the deadline.
