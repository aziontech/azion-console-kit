---
name: theme-management
description: How to work with theme management in Azion Console Kit
---

# Theme Management Skill

This document describes the theme management architecture in Azion Console Kit, including how to read, set, and react to theme changes.

## Architecture Overview

Theme management is handled by a dedicated Pinia store (`useThemeStore`) that is completely decoupled from account/user data. This ensures theme persistence across sessions and prevents theme state from being lost during logout/login flows.

## Key Files

| File | Purpose |
|------|---------|
| `src/stores/theme.js` | Pinia store for theme state, exports `useThemeStore`, `getSystemTheme`, `DARK_SCHEME_QUERY` |
| `src/helpers/theme-apply.js` | Helper to apply theme to DOM (adds/removes CSS classes on `:root`) |
| `src/router/hooks/guards/themeGuard.js` | Router guard that initializes theme on app load |
| `src/App.vue` | Watches theme changes and listens for OS theme preference changes |

## Theme Store (`src/stores/theme.js`)

### Exports

```javascript
// Constants
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

// Helper function - returns 'dark' or 'light' based on OS preference
export const getSystemTheme = () => {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light'
}

// Pinia store
export const useThemeStore = defineStore({
  id: 'theme',
  state: () => ({
    theme: getInitialTheme(),
    resolved: getInitialTheme()
  }),
  getters: {
    currentTheme: (state) => state.theme,
    resolvedTheme: (state) => state.resolved
  },
  actions: {
    setTheme(theme) {
      this.theme = theme
      this.resolved = theme === 'system' ? getSystemTheme() : theme
      localStorage.setItem('theme', theme)
    },
    setResolvedTheme(theme) {
      this.resolved = theme === 'system' ? getSystemTheme() : theme
    }
  }
})
```

### Theme Values

- `'light'` - Light theme
- `'dark'` - Dark theme  
- `'system'` - Follow OS preference

### State vs Resolved Theme

The store maintains two separate values:

| Property | Description | Possible Values |
|----------|-------------|----------------|
| `theme` | User's selected preference | `'light'`, `'dark'`, `'system'` |
| `resolved` | Actual applied theme | `'light'`, `'dark'` |

When `theme` is `'system'`, the `resolved` value reflects the current OS preference. This separation is essential for components that need the actual theme value (e.g., Monaco Editor) rather than the user preference.

### Persistence

Theme is persisted in `localStorage` under the key `'theme'`.

## Reading Theme in Components

### Using `storeToRefs` (Recommended for reactivity)

```javascript
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)

// Use in template or watch
watch(currentTheme, (theme) => {
  console.log('Theme changed to:', theme)
})
```

### Direct access (for non-reactive reads)

```javascript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const theme = themeStore.currentTheme
```

### For Monaco Editor theme (use `resolvedTheme`)

Monaco Editor and other third-party components need the actual theme, not the user preference. Use `resolvedTheme` for these cases:

```javascript
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'

const store = useThemeStore()
const theme = computed(() => {
  return store.resolvedTheme === 'light' ? 'vs' : 'vs-dark'
})
```

**Why `resolvedTheme`?** When the user selects "System" theme, `currentTheme` returns `'system'`, which Monaco doesn't understand. `resolvedTheme` always returns `'light'` or `'dark'`, making it safe for third-party integrations.

## Setting Theme

```javascript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
themeStore.setTheme('dark')  // or 'light' or 'system'
```

## Applying Theme to DOM

The `themeApply` helper applies the theme by toggling CSS classes on the `:root` element:

```javascript
import { themeApply } from '@/helpers'

themeApply('dark')   // Applies azion-dark class
themeApply('light')  // Applies azion-light class
themeApply('system') // Resolves to dark/light based on OS preference
```

### CSS Classes

- `azion-light` - Light theme styles
- `azion-dark` - Dark theme styles

## System Theme Detection

To detect or react to OS theme preference:

```javascript
import { DARK_SCHEME_QUERY, getSystemTheme } from '@/stores/theme'

// Get current system theme
const systemTheme = getSystemTheme() // Returns 'dark' or 'light'

// Listen for OS theme changes (done in App.vue)
window.matchMedia(DARK_SCHEME_QUERY).addEventListener('change', (event) => {
  if (currentTheme.value === 'system') {
    themeApply(event.matches ? 'dark' : 'light')
  }
  // Update resolved theme so reactive components update
  themeStore.setResolvedTheme(currentTheme.value)
})
```

**Important:** Always call `setResolvedTheme()` when the OS theme changes. This ensures components using `resolvedTheme` (like Monaco Editor) react to the change.

## Common Patterns

### Adding theme support to a new component

1. Import the theme store:
   ```javascript
   import { useThemeStore } from '@/stores/theme'
   ```

2. Get the current theme:
   ```javascript
   const store = useThemeStore()
   const theme = computed(() => store.currentTheme)
   ```

3. Use in template or logic:
   ```html
   <div :class="{ 'dark-mode': theme === 'dark' }">...</div>
   ```

### Theme-aware styling

```javascript
const badgeClass = computed(() => {
  return currentTheme.value === 'light'
    ? 'bg-gray-200 text-gray-800'
    : 'bg-gray-700 text-gray-200'
})
```

## Testing

Test file: `src/tests/helpers/themeApply.test.js`

When testing theme-related code, mock `window.matchMedia`:

```javascript
vi.spyOn(window, 'matchMedia').mockReturnValue({
  matches: true // true = dark mode, false = light mode
})
```

## Important Notes

1. **Never store theme in account data** - Theme is UI preference, not user data
2. **Always use `useThemeStore`** - Don't access localStorage directly for theme
3. **Use `storeToRefs` for reactivity** - Ensures components update when theme changes
4. **Handle 'system' theme** - Always resolve to actual theme when applying to DOM
5. **Use `resolvedTheme` for third-party components** - Monaco Editor, charts, etc. need actual theme values
6. **Call `setResolvedTheme()` on OS theme change** - Ensures reactive updates for components using `resolvedTheme`
7. **Test with both themes** - Ensure components look correct in both light and dark modes
8. **Test System theme** - Verify components update when OS preference changes

## Migration Guide (from account store)

If you find code using the old pattern:

```javascript
// OLD - Don't use
import { useAccountStore } from '@/stores/account'
const accountStore = useAccountStore()
const theme = accountStore.currentTheme
accountStore.setTheme('dark')
```

Replace with:

```javascript
// NEW - Use this
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
const theme = themeStore.currentTheme
themeStore.setTheme('dark')
```
