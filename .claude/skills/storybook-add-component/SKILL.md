---
name: storybook-add-component
description: Add a new component to Console Storybook with complete documentation, proper patterns, and successful builds
---

# Adding Component to Storybook

This skill provides comprehensive guidance for adding new components to the Console Storybook with complete documentation, proper patterns, and successful builds.

## Overview

The Console Storybook documents all UI components in isolation. Each component requires a story file that demonstrates its props, slots, and states. Stories must follow specific patterns and conventions to ensure consistency and successful builds.

## Technical Specification

**Storybook Location:**
- Stories directory: `storybook/src/stories/templates/`
- Story file naming: `{ComponentName}.stories.js` (JavaScript, NOT TypeScript)
- Title pattern: `Templates/{ComponentName}`
- Import path: `@/templates/{component-path}/index.vue`

**Build Command:**
```bash
yarn storybook:build
```

**Story Structure:**
All stories use this base structure:
```javascript
import Component from '@/templates/{component-path}/index.vue';

export default {
  title: 'Templates/{ComponentName}',
  component: Component,
  tags: ['autodocs']
};

export const Default = {
  args: {}
};
```

## Step-by-Step Process

### Step 1: Locate the Component
1. Find the component in `/src/templates/{component-name}/index.vue`
2. Read the component file to identify:
   - All props (from `defineProps` or `props` option)
   - All slots (from `<slot>` tags in template)
   - All emitted events (from `defineEmits` or `$emit`)
   - Component purpose and typical use cases

### Step 2: Create Story File
1. Create file at: `storybook/src/stories/templates/{ComponentName}.stories.js`
2. Use PascalCase for filename matching component name
3. Import component using `@/templates/` alias path

### Step 3: Choose Story Pattern

**Pattern 1: Minimal Story**
Use for components with no props or slots:
```javascript
import Component from '@/templates/component-name/index.vue';

export default {
  title: 'Templates/ComponentName',
  component: Component,
  tags: ['autodocs']
};

export const Default = {
  args: {}
};
```

**Pattern 2: Extended Story with Props**
Use for components with props but no slots:
```javascript
import Component from '@/templates/component-name/index.vue';

export default {
  title: 'Templates/ComponentName',
  component: Component,
  tags: ['autodocs'],
  argTypes: {
    prop1: {
      control: 'boolean',
      description: 'Description of prop1'
    },
    prop2: {
      control: 'text',
      description: 'Description of prop2'
    },
    prop3: {
      control: 'select',
      options: ['option1', 'option2', 'option3'],
      description: 'Description of prop3'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Full component description explaining purpose and use cases.'
      }
    }
  }
};

export const Default = {
  args: {
    prop1: false,
    prop2: 'Default text',
    prop3: 'option1'
  }
};

export const Variant1 = {
  args: {
    prop1: true,
    prop2: 'Different text',
    prop3: 'option2'
  }
};
```

**Pattern 3: Complex Story with Slots**
Use for components with slots:
```javascript
import Component from '@/templates/component-name/index.vue';

export default {
  title: 'Templates/ComponentName',
  component: Component,
  tags: ['autodocs'],
  argTypes: {
    prop1: {
      control: 'boolean',
      description: 'Description of prop1'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Component description.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { Component },
    setup() {
      return { args };
    },
    template: `
      <Component v-bind="args">
        <template #slotName>
          <div>Slot content here</div>
        </template>
      </Component>
    `
  }),
  args: {
    prop1: false
  }
};
```

### Step 4: Document All Props
For each prop in the component, add to `argTypes`:
- `control`: Type of control (`boolean`, `text`, `select`, `number`, `object`)
- `description`: Clear, concise description of what the prop does
- `options`: Array of options (only for `select` control)

**Control Type Mapping:**
- Boolean props → `control: 'boolean'`
- String props → `control: 'text'`
- Number props → `control: 'number'`
- Enum props → `control: 'select'` with `options` array
- Object/Function props → `control: 'object'`

### Step 5: Document All Slots
For each slot in the component, create a story using render function:
```javascript
export const WithSlots = {
  render: (args) => ({
    components: { Component },
    setup() {
      return { args };
    },
    template: `
      <Component v-bind="args">
        <template #slotName1>
          <div>Content for slot 1</div>
        </template>
        <template #slotName2>
          <div>Content for slot 2</div>
        </template>
      </Component>
    `
  }),
  args: { ... }
};
```

### Step 6: Create State Variants
Create multiple story exports for different states:
- `Default` - Basic state with typical props
- `Loading` - If component has loading state
- `Disabled` - If component has disabled state
- `Variant` - For each significant prop combination
- `EdgeCase` - For boundary values or special configurations

### Step 7: Add Component Description
Include in `parameters.docs.description.component`:
- What the component does
- When to use it
- Key features
- Any important notes

### Step 7.5: Handle Dependency Injection Components

**When a component uses `inject()`** to receive data from a parent provider (common in dynamic dialogs, modals, or service-based components), you need a wrapper component in the story.

**Pattern: Wrapper Component for Dependency Injection**

Use this pattern when:
- Component uses `inject('dialogRef')` or similar
- Component is designed for PrimeVue Dynamic Dialogs
- Component expects data from a service at runtime

**Example - DialogCopyKey component:**
```javascript
import DialogCopyKey from '@/templates/dialog-copy-key/index.vue';
import { ref, provide } from 'vue';

export default {
  title: 'Templates/DialogCopyKey',
  component: DialogCopyKey,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A dialog component that uses dialogRef injection for data.'
      }
    }
  }
};

// Wrapper component provides the injection
const DialogWrapper = {
  components: { DialogCopyKey },
  props: {
    title: {
      type: String,
      default: 'API Key'
    },
    keyValue: {
      type: String,
      default: 'sk-1234567890abcdef'
    }
  },
  setup(props) {
    // Create the data structure the component expects
    const dialogData = ref({
      title: props.title,
      key: props.keyValue
    });

    // Create dialogRef that mimics PrimeVue's dynamic dialog
    const dialogRef = ref({
      data: dialogData.value,
      close: () => {
        console.log('Dialog closed');
      }
    });

    // Provide the injection
    provide('dialogRef', dialogRef);

    return {};
  },
  template: `
    <DialogCopyKey />
  `
};

export const Default = {
  render: () => ({
    components: { DialogWrapper },
    template: '<DialogWrapper title="Personal Token" keyValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />'
  })
};
```

**Why this is needed:**
- In production, PrimeVue's dialog service automatically provides `dialogRef`
- In Storybook's isolated environment, the service doesn't exist
- Wrapper manually provides the injection the component expects
- Without it, the component would fail or render nothing

**Common scenarios requiring wrappers:**
- `inject('dialogRef')` - PrimeVue dynamic dialogs
- `inject('toast')` - Toast notification services
- `inject('router')` - Custom router implementations
- `inject('store')` - Vuex/Pinia store injections
- Any service-based dependency injection

### Step 8: Test Build
Run build command and verify success:
```bash
yarn storybook:build
```

Fix any errors before completing.

## Must Have

- ✅ **Complete Story File:** File created with correct naming (`{ComponentName}.stories.js`)
- ✅ **Correct Import Path:** Using `@/templates/{component-path}/index.vue`
- ✅ **All Props Documented:** Every prop has `argTypes` entry with control and description
- ✅ **All Slots Demonstrated:** Every slot shown in at least one story with render function
- ✅ **Multiple Story Variants:** At least Default story, plus variants for different states
- ✅ **Component Description:** Clear description in `parameters.docs.description.component`
- ✅ **Consistent Naming:** Title matches pattern `Templates/{ComponentName}`
- ✅ **Successful Build:** `yarn storybook:build` completes without errors
- ✅ **Autodocs Tag:** `tags: ['autodocs']` included in default export

## Must Not Have

- ❌ **TypeScript Files:** Never use `.ts` extension for story files (use `.js`)
- ❌ **Build Errors:** Story must build successfully with `yarn storybook:build`
- ❌ **Missing Props:** No prop in component should be undocumented
- ❌ **Missing Slots:** No slot in component should be undemonstrated
- ❌ **Wrong Import Paths:** Never use relative imports (always use `@/templates/` alias)
- ❌ **Incomplete argTypes:** Never omit control type or description for props
- ❌ **Empty Story Files:** Every story must have at least Default export with args
- ❌ **Missing Tags:** Never skip `tags: ['autodocs']` in default export

## Common Patterns by Component Type

### Action/Navigation Components
Examples: ActionBarBlock, GoBack
- Document all action labels (primary/secondary)
- Show loading and disabled states
- Demonstrate custom handlers
- Include in-drawer variants if applicable

### Drawer/Modal Components
Examples: InfoDrawerBlock, EmptyDrawer
- Use render functions for slot content
- Demonstrate visibility control (v-model:visible)
- Show different content scenarios
- Include interactive examples

### Form/Input Components
Examples: CreateFormBlock, EditFormBlock
- Show empty and filled states
- Demonstrate validation states
- Include disabled/readonly variants
- Document all slots (labels, helpers, etc.)

### Feedback Components
Examples: ToastBlock, MessageNotification
- Show all severity/type variants
- Include interactive controls to trigger states
- Demonstrate action buttons
- Show auto-dismiss behavior

### Layout/Display Components
Examples: LoadingBlock, EmptyResultsBlock
- Show all size variants
- Demonstrate all content configurations
- Include with/without illustration variants
- Document all slots

## Quality Checklist

Before completing, verify:
- [ ] Story file exists at correct location
- [ ] Filename uses PascalCase with `.stories.js` extension
- [ ] Import path uses `@/templates/` alias
- [ ] All component props have argTypes
- [ ] All argTypes have control type AND description
- [ ] All slots demonstrated in render function
- [ ] Multiple story variants for different states
- [ ] Component description in parameters.docs
- [ ] Autodocs tag included
- [ ] Build succeeds: `yarn storybook:build`
- [ ] No console errors in build output
- [ ] Story renders correctly in Storybook UI

## Examples from Existing Stories

**Minimal Example (ContentBlock):**
```javascript
import ContentBlock from '@/templates/content-block/index.vue';

export default {
  title: 'Templates/ContentBlock',
  component: ContentBlock,
  tags: ['autodocs']
};

export const Default = {
  args: {}
};
```

**Extended Example (ActionBarBlock):**
- Multiple props with argTypes
- 5 state variants
- Additional component variants (GoBack)
- All controls properly typed

**Complex Example (InfoDrawerBlock):**
- Render function with slots
- v-model binding demonstration
- Slot content examples
- Interactive state

**Interactive Example (ToastBlock):**
- Setup function with toast methods
- Interactive buttons to trigger states
- Multiple severity demonstrations
- Action callbacks

## Troubleshooting

**Build Fails:**
- Check import paths are correct
- Verify component exists at path
- Look for syntax errors in story file
- Check for missing dependencies

**Props Not Showing:**
- Ensure argTypes is defined in default export
- Verify control type matches prop type
- Check description is provided

**Slots Not Rendering:**
- Use render function, not template string directly
- Include components: { Component } in render function
- Use v-bind="args" in template
- Wrap slot content in `<template #slotName>`

**Component Uses Dependency Injection:**
- Check if component has `inject()` calls
- Create wrapper component that provides the injection
- Use `provide('injectionKey', ref({...}))` in wrapper's setup
- Mimic the data structure the component expects
- See Step 7.5 for detailed pattern

**Component Not Found:**
- Verify import path uses `@/templates/` alias
- Check component is in /src/templates/ directory
- Ensure component file is index.vue

## Notes

- Stories use JavaScript (`.js`) not TypeScript
- Import alias `@/templates/` maps to `/src/templates/`
- Story file location differs from component location
- Multiple components can share one story file if related
- Build command is separate from dev server
- Always test build before considering complete