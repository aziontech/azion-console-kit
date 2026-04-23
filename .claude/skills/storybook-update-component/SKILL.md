---
name: storybook-update-component
description: Update existing Storybook component stories to reflect component changes (props, slots, events)
---

# Updating Storybook Component

This skill provides comprehensive guidance for updating existing component stories in the Console Storybook, ensuring documentation stays synchronized with component changes.

## Overview

When components are modified (props added/removed, slots changed, events updated), their Storybook stories must be updated to reflect these changes. This skill ensures stories remain accurate, complete, and build successfully.

## Technical Specification

**Storybook Configuration:**
- Stories directory: `storybook/src/stories/templates/`
- Story file naming: `{ComponentName}.stories.js`
- Main vite config: `vite.config.js` (defines aliases)
- Storybook vite config: `storybook/.storybook/main.js` (resolves aliases)

**Path Aliases (configured in Storybook):**
```javascript
'@' → '../../src'
'@templates' → '../../src/templates'
'@components' → '../../src/components'
```

**Import Patterns in Stories:**
- Templates: `import Component from '@/templates/{component-name}/index.vue'`
- Components: `import Component from '@/components/{component-name}/index.vue'`

**Build Command:**
```bash
yarn storybook:build
```

## Step-by-Step Process

### Step 1: Parse User Input
The user provides: `storybook-update-component @filepath`

1. Extract the filepath from the input
2. Determine if it's:
   - A component file (e.g., `@src/templates/my-component/index.vue`)
   - A story file (e.g., `@storybook/src/stories/templates/MyComponent.stories.js`)
   - A package.json export name

### Step 2: Identify Component Location

**Read the provided file to determine:**

1. **If component file provided:**
   - Read the component file
   - Extract component name from filename or directory
   - Identify if it's in `src/templates/` or `src/components/`

2. **If story file provided:**
   - Read the story file
   - Extract import statement to find component path
   - Map import back to actual component file

3. **If package.json export name provided:**
   - Check package.json exports field (if exists)
   - Map export name to file path

**Component Location Resolution:**
```javascript
// From story import
import ActionBarBlock from '@/templates/action-bar-block/index.vue'
// Resolves to: src/templates/action-bar-block/index.vue

import SomeComponent from '@/components/some-component/index.vue'
// Resolves to: src/components/some-component/index.vue
```

### Step 3: Read Component File

**Extract from component:**
```javascript
// Vue 3 Composition API
const props = defineProps({
  prop1: { type: Boolean, default: false },
  prop2: { type: String, default: '' },
  prop3: { type: Number, default: 0 }
})

const emit = defineEmits(['update', 'submit'])

// Template
<template>
  <div>
    <slot name="header"></slot>
    <slot>Default slot</slot>
    <slot name="footer"></slot>
  </div>
</template>
```

**Parse and categorize:**
1. **Props:** All properties from `defineProps` or `props` option
   - Name, type, default value, required status
   - Validation rules
2. **Slots:** All `<slot>` tags in template
   - Slot names (default vs named)
   - Slot content (if default content provided)
3. **Events:** All from `defineEmits` or `$emit` calls
   - Event names
   - Event payloads
4. **Component Purpose:** Infer from component name, comments, usage

### Step 4: Read Existing Story File

**Locate story file:**
```bash
# For templates
storybook/src/stories/templates/{ComponentName}.stories.js

# For components
storybook/src/stories/components/{ComponentName}.stories.js
```

**If story file doesn't exist:**
- Inform user this is a NEW component
- Recommend using `storybook-add-component` skill instead
- Stop execution

**If story file exists:**
Read and parse:
1. Default export configuration
   - `title` - Component title
   - `argTypes` - Prop documentation
   - `parameters` - Component description
   - `tags` - Autodocs tag
2. Named exports (stories)
   - Story names
   - Story args
   - Render functions
   - Template strings

### Step 5: Compare Component vs Story

**Create comparison matrix:**

| Component Feature | Story Documentation | Status |
|-------------------|---------------------|---------|
| `prop1: Boolean` | ✅ in argTypes | MATCH |
| `prop2: String` | ✅ in argTypes | MATCH |
| `prop3: Number` | ❌ missing | MISSING |
| `slot default` | ✅ in render | MATCH |
| `slot header` | ❌ missing | MISSING |
| `slot footer` | ✅ in render | MATCH |
| `event update` | ❌ missing | MISSING |

**Categorize changes:**

1. **New Props:** Props in component but not in story argTypes
2. **Removed Props:** Props in story argTypes but not in component
3. **Modified Props:** Props with changed types or defaults
4. **New Slots:** Slots in component but not demonstrated in story
5. **Removed Slots:** Slots demonstrated in story but not in component
6. **New Events:** Events in component but not documented in story
7. **Removed Events:** Events documented in story but not in component

### Step 6: Update Story File

**For NEW props:**
```javascript
argTypes: {
  // ... existing props
  newProp: {
    control: 'text', // or 'boolean', 'number', 'select', 'object'
    description: 'Description of newProp (inferred from component or generic)'
  }
}
```

**For REMOVED props:**
```javascript
argTypes: {
  // Remove the deleted prop from argTypes
  // Also remove from any story args that use it
}
```

**For MODIFIED props:**
```javascript
argTypes: {
  // Update control type if type changed
  // Update description if behavior changed
  // Update default value in story args
  propWithNewType: {
    control: 'select', // Changed from 'text'
    options: ['option1', 'option2'],
    description: 'Updated description'
  }
}
```

**For NEW slots:**
```javascript
// Add new story variant demonstrating the slot
export const WithAllSlots = {
  render: (args) => ({
    components: { Component },
    setup() {
      return { args };
    },
    template: `
      <Component v-bind="args">
        <template #existingSlot>
          <div>Existing slot</div>
        </template>
        <template #newSlot>
          <div>New slot content</div>
        </template>
      </Component>
    `
  }),
  args: { ... }
};
```

**For REMOVED slots:**
```javascript
// Remove slot from render functions
// Remove entire story if it only demonstrated removed slot
```

**For events:**
```javascript
// Events don't have argTypes in Storybook
// Document in parameters.docs.description.component or add to story template
parameters: {
  docs: {
    description: {
      component: `
        Component description.

        **Events:**
        - \`update\`: Emitted when value changes
        - \`submit\`: Emitted when form submits
      `
    }
  }
}
```

**For components with dependency injection:**
```javascript
// Component uses inject('dialogRef')
// Story needs a wrapper component to provide the injection

import { ref, provide } from 'vue';

// Wrapper component mimics the provider
const ComponentWrapper = {
  components: { Component },
  props: {
    // Props that will be passed to injected data
    prop1: { type: String, default: 'value' }
  },
  setup(props) {
    // Create the injection data
    const injectedData = ref({
      data: { prop1: props.prop1 },
      close: () => console.log('close')
    });

    // Provide the injection
    provide('dialogRef', injectedData);

    return {};
  },
  template: `<Component />`
};

// Story uses wrapper
export const Default = {
  render: () => ({
    components: { ComponentWrapper },
    template: '<ComponentWrapper prop1="value" />'
  })
};
```

**When you need a wrapper:**
- Component has `inject('dialogRef')` or similar
- Component designed for PrimeVue Dynamic Dialogs
- Story fails with "injection not found" errors
- Component renders nothing without provider

See Troubleshooting section for more details.

### Step 7: Update Component Description

**If component purpose changed:**
```javascript
parameters: {
  docs: {
    description: {
      component: 'Updated description reflecting component changes.'
    }
  }
}
```

### Step 8: Verify Story Variants

**Check existing story variants are still valid:**
- Default story should use typical props
- Variant stories should demonstrate different states
- All variants should still work with updated component

**Update variant stories if needed:**
```javascript
export const Loading = {
  args: {
    loading: true,
    // Add new required props
    newProp: 'default value'
  }
};
```

### Step 9: Test Build

**Run build command:**
```bash
yarn storybook:build
```

**Check for:**
- Build completes successfully
- No console errors
- No warnings about missing props
- No warnings about unknown props

**If build fails:**
- Fix syntax errors
- Fix import paths
- Fix missing dependencies
- Re-run build until success

### Step 10: Verify in Storybook UI

**Open Storybook:**
```bash
yarn storybook:dev
```

**Check:**
- Component appears in correct category
- All props appear in Controls panel
- All slots render correctly
- All variants work as expected
- No console errors

## Must Have

- ✅ **All Component Props Documented:** Every prop in component has argTypes entry
- ✅ **All Slots Demonstrated:** Every slot shown in at least one story
- ✅ **No Removed Props:** Story argTypes match current component props
- ✅ **No Removed Slots:** Story doesn't reference removed slots
- ✅ **Correct Control Types:** Control type matches prop type
- ✅ **Descriptions Updated:** Prop descriptions reflect current behavior
- ✅ **Story Variants Valid:** All existing stories work with updated component
- ✅ **Build Success:** `yarn storybook:build` completes without errors
- ✅ **Consistent Patterns:** Story follows project conventions

## Must Not Have

- ❌ **Stale Props:** Props removed from component still in argTypes
- ❌ **Missing Props:** New props in component not in argTypes
- ❌ **Stale Slots:** Slots removed from component still in stories
- ❌ **Missing Slots:** New slots in component not demonstrated
- ❌ **Wrong Control Types:** Control doesn't match prop type
- ❌ **Build Errors:** Story fails to build
- ❌ **Broken Stories:** Stories reference non-existent props/slots
- ❌ **Inconsistent Patterns:** Story doesn't match project conventions

## Change Detection Patterns

### Detecting New Props
```javascript
// Component has prop
const props = defineProps({
  newProp: String
})

// Story argTypes doesn't have it
argTypes: {
  oldProp: { ... }
  // newProp missing!
}
```

### Detecting Removed Props
```javascript
// Component doesn't have prop
const props = defineProps({
  existingProp: String
})

// Story argTypes has it
argTypes: {
  existingProp: { ... },
  removedProp: { ... } // Should be removed!
}
```

### Detecting New Slots
```javascript
// Component template has slot
<template>
  <div>
    <slot name="existing"></slot>
    <slot name="newSlot"></slot> // New!
  </div>
</template>

// Story doesn't show it
template: `
  <Component>
    <template #existing>...</template>
    // #newSlot missing!
  </Component>
`
```

### Detecting Modified Props
```javascript
// Component prop type changed
const props = defineProps({
  status: {
    type: String,
    validator: (v) => ['active', 'inactive'].includes(v) // Now enum!
  }
})

// Story has wrong control
argTypes: {
  status: {
    control: 'text' // Should be 'select' with options!
  }
}
```

## Control Type Mapping

| Prop Type | Control Type | Additional Config |
|-----------|--------------|-------------------|
| `Boolean` | `'boolean'` | None |
| `String` | `'text'` | None |
| `String` (enum) | `'select'` | `options: [...]` |
| `Number` | `'number'` | None |
| `Array` | `'object'` | None |
| `Object` | `'object'` | None |
| `Function` | `'object'` | None |
| `Date` | `'date'` | None |

## Update Strategy

### Minor Updates (Add/Remove Props)
1. Add new props to argTypes
2. Remove deleted props from argTypes
3. Update default args in all stories
4. Test build

### Major Updates (Add/Remove Slots)
1. Add new slots to render functions
2. Remove deleted slots from render functions
3. Create new story variant demonstrating new slots
4. Remove story variants that only showed deleted slots
5. Test build

### Breaking Changes (Component Refactored)
1. Consider if story needs complete rewrite
2. Check if existing patterns still apply
3. May need to create new story from scratch
4. Test build
5. Verify in UI

## Common Scenarios

### Scenario: New Boolean Prop Added
```javascript
// Component change
const props = defineProps({
  disabled: { type: Boolean, default: false } // New prop
})

// Story update
argTypes: {
  // ... existing
  disabled: {
    control: 'boolean',
    description: 'Disables the component'
  }
}

// Update all story variants
export const Default = {
  args: {
    // ... existing
    disabled: false // Add default
  }
};

export const Disabled = { // New variant
  args: {
    disabled: true
  }
};
```

### Scenario: Slot Removed
```javascript
// Component change
<template>
  <div>
    <slot></slot>
    // <slot name="deprecated"> removed!
  </div>
</template>

// Story update
export const Default = {
  render: (args) => ({
    components: { Component },
    setup() {
      return { args };
    },
    template: `
      <Component v-bind="args">
        // Remove deprecated slot
      </Component>
    `
  }),
  args: { ... }
};
```

### Scenario: Prop Type Changed to Enum
```javascript
// Component change
const props = defineProps({
  size: {
    type: String,
    validator: (v) => ['small', 'medium', 'large'].includes(v) // Changed from any string
  }
})

// Story update
argTypes: {
  size: {
    control: 'select', // Changed from 'text'
    options: ['small', 'medium', 'large'],
    description: 'Component size'
  }
}

// Add size variants
export const Small = {
  args: { size: 'small' }
};

export const Medium = {
  args: { size: 'medium' }
};

export const Large = {
  args: { size: 'large' }
};
```

## Quality Checklist

Before completing, verify:
- [ ] Identified all component changes
- [ ] Story file located
- [ ] All new props added to argTypes
- [ ] All removed props deleted from argTypes
- [ ] All modified props updated with correct control
- [ ] All new slots demonstrated
- [ ] All removed slots removed from stories
- [ ] All story variants updated with new/changed props
- [ ] Component description updated if needed
- [ ] Build succeeds: `yarn storybook:build`
- [ ] No console errors
- [ ] Story renders correctly in UI

## Troubleshooting

**Story Not Found:**
- Check story file location matches component location
- Templates → `storybook/src/stories/templates/`
- Components → `storybook/src/stories/components/`

**Build Fails After Update:**
- Check for removed props still referenced in story args
- Check for removed slots still referenced in templates
- Verify import path is correct
- Check for syntax errors in story file

**Props Not Appearing:**
- Verify prop is in argTypes
- Check control type is correct
- Ensure description is provided
- Verify story args include the prop

**Slots Not Rendering:**
- Use render function for slot demonstration
- Check `components: { Component }` is included
- Use `<template #slotName>` syntax
- Ensure v-bind="args" is in template

**Wrong Import Path:**
- Use `@/templates/` for template components
- Use `@/components/` for other components
- Check component is in correct directory

**Component Requires Injection:**
If component uses `inject()` and story fails or renders nothing:
- Check component for `inject('dialogRef')` or similar
- Create wrapper component in story file
- Use `provide()` in wrapper's setup to provide expected injection
- Wrapper mimics what the service/framework provides at runtime
- Example: PrimeVue Dynamic Dialogs provide `dialogRef` automatically in production
- In Storybook, must manually provide it via wrapper
- See Step 6 for injection wrapper pattern

**Debugging Injection Issues:**
```javascript
// Add console.log to understand what component expects
setup() {
  const injected = inject('dialogRef');
  console.log('Expected injection:', injected);
  // This will show undefined if not provided
}
```

## Examples

### Example: Updating ActionBarBlock with New Prop

**Component change detected:**
```javascript
// New prop added to component
const props = defineProps({
  loading: { type: Boolean, default: false },
  inDrawer: { type: Boolean, default: false },
  cancelDisabled: { type: Boolean, default: false },
  primaryActionLabel: { type: String, default: 'Save' },
  secondaryActionLabel: { type: String, default: 'Cancel' },
  goBack: { type: Function }, // Function prop
  size: { type: String, validator: v => ['small', 'medium', 'large'].includes(v) } // New!
})
```

**Story update:**
```javascript
// Read existing story
// Add to argTypes
argTypes: {
  // ... existing props
  size: { // New!
    control: 'select',
    options: ['small', 'medium', 'large'],
    description: 'Size variant for the action bar'
  }
}

// Update story args
export const Default = {
  args: {
    // ... existing
    size: 'medium' // Add default
  }
};

// Create new variants
export const Small = {
  args: {
    loading: false,
    size: 'small'
  }
};

export const Large = {
  args: {
    loading: false,
    size: 'large'
  }
};
```

### Example: Removing Deprecated Slot

**Component change detected:**
```javascript
// Component template changed
<template>
  <div>
    <slot name="header"></slot>
    <slot></slot>
    // <slot name="deprecated"> removed
  </div>
</template>
```

**Story update:**
```javascript
// Find stories using deprecated slot
export const OldStory = {
  render: (args) => ({
    components: { Component },
    setup() {
      return { args };
    },
    template: `
      <Component v-bind="args">
        <template #header>Header</template>
        <template #deprecated>Remove this</template> // Remove!
      </Component>
    `
  }),
  args: { ... }
};

// Updated version
export const OldStory = {
  render: (args) => ({
    components: { Component },
    setup() {
      return { args };
    },
    template: `
      <Component v-bind="args">
        <template #header>Header</template>
      </Component>
    `
  }),
  args: { ... }
};
```

## Notes

- Stories use JavaScript (`.js`) not TypeScript
- Import alias `@` maps to `/src` directory
- Preserve existing story patterns and variants
- Don't remove stories unless they become invalid
- Add new variants for significant new features
- Test all changes with build command
- Update descriptions when behavior changes
- Keep argTypes alphabetically organized for readability