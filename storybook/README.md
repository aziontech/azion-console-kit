# Azion Console Kit Storybook

This Storybook showcases templates/components from the azion-console-kit project.

## Getting Started

### Prerequisites

- Node.js >= 22.18.0
- Yarn >= 1.22.22

### Installation

Install dependencies from the root directory:

```bash
cd /path/to/azion-console-kit
yarn install
```

### Running Storybook

From the root directory:

```bash
yarn storybook:dev
```

Or from the storybook directory:

```bash
cd storybook
yarn dev
```

This will start the Storybook development server on `http://localhost:6006`.

### Building Storybook

From the root directory:

```bash
yarn storybook:build
```

Or from the storybook directory:

```bash
cd storybook
yarn build
```

This will create a static build in the `storybook/dist` directory.

### Previewing Build Locally

After building, you can preview the static build locally:

```bash
cd storybook
yarn preview
```

This serves the built Storybook on `http://localhost:6007`.

### Deploying to Azion

The Storybook can be deployed to Azion's edge network:

```bash
cd storybook
yarn deploy
```

This requires:
- Azion CLI installed
- Valid `AZION_PERSONAL_TOKEN` configured via `azion -t <token>`

The deployment is configured via `azion.config.mjs` and deploys to the `dist` directory.

### Automated Deployment (CI/CD)

Deployment is automated via GitHub Actions:

- **Trigger**: Push to `storybook` branch with changes in `src/storybook/**`
- **Workflow**: `.github/workflows/deploy-storybook.yml`
- **Process**: Installs dependencies → Builds Storybook → Deploys to Azion edge network
- **Requirements**: `AZION_PERSONAL_TOKEN` secret must be configured in GitHub repository

**Important**: Local commits to the `storybook` branch will automatically trigger deployment if files in `src/storybook/` are modified.

## Features

- **Dark/Light Theme Toggle**: Switch between dark and light themes to see how components look in both modes
- **Vue 3 + PrimeVue 3**: Built with Vue 3 and PrimeVue 3 component library
- **Tailwind CSS**: Styled with Tailwind CSS and Azion's theme
- **Structured Stories**: Well-organized stories following the pattern from the webkit storybook
- **Autodocs**: Automatic documentation generation for all components

## Available Templates (31 Stories)

The following templates have been documented in Storybook:

1. **Activity History Block** - Displays activity history records
2. **Advanced Filter** - Advanced filtering interface
3. **Banner Full Block** - Full-width banner component
4. **Card Flag Block** - Card with flag indicators
5. **Clone Block** - Cloning interface component
6. **Content Block** - General content container
7. **Create Form Block** - Form for creating new resources
8. **Create Modal Block** - Modal dialog for creating resources
9. **Danger Card Block** - Warning/destructive action card
10. **Dialog Copy Key** - Dialog for copying API keys
11. **Edit Form Block** - Form for editing existing resources
12. **Empty Results Block** - Empty state display
13. **Error Page Block** - Error page layouts (404, 500, etc.)
14. **Info Banner** - Informational banner component
15. **List Table Block** - Table listing component
16. **Loading Block** - Loading indicator overlay
17. **Message Notification** - Notification message component
18. **MFA Authenticate Block** - Multi-factor authentication interface
19. **MFA Setup Block** - MFA setup wizard
20. **Page Heading Block** - Page header with title and description
21. **Page Heading Block Tabs** - Page header with tab navigation
22. **Script Runner Block** - Script execution interface
23. **Search Block** - Search functionality component
24. **Sign In Block** - Sign-in form interface
25. **Single Block** - Single item display component
26. **Skeleton Block** - Loading skeleton placeholder
27. **Social IDPS Block** - Social identity providers component
28. **Steps Block** - Multi-step wizard interface
29. **Switch Account Block** - Account switching interface
30. **Template Engine Block** - Template execution engine interface
31. **Toast Block** - Toast notification system

## Available Scripts

From the storybook directory:

- `yarn dev` - Start development server on port 6006
- `yarn build` - Build static Storybook to `dist/`
- `yarn preview` - Preview built Storybook locally on port 6007
- `yarn build:azion` - Build with Azion CLI (for edge deployment)
- `yarn deploy` - Deploy to Azion edge network (requires Azion CLI and authentication)

## Configuration

- **Storybook Configuration**: `.storybook/main.js` and `.storybook/preview.js`
- **Tailwind Configuration**: `tailwind.config.js`
- **PostCSS Configuration**: `postcss.config.js`
- **Azion Configuration**: `azion.config.mjs` - Configures edge deployment, storage, caching, and routing rules

### Azion Edge Configuration

The `azion.config.mjs` file configures:

- **Storage**: Static files served from `dist/` directory
- **Caching**: 
  - Browser cache: 5 minutes
  - Edge cache: 2 hours
- **Routing**: Handles directory requests and subpaths with automatic `index.html` rewriting
- **CORS**: Enables `Access-Control-Allow-Origin: *` for all requests
- **Connector**: Links to Azion storage bucket `console-kit-storybook`

## Path Aliases

The following path aliases are configured:

- `@` → `src/`
- `@templates` → `src/templates/`
- `@assets` → `src/assets/`
- `@layout` → `src/layout/`
- `@components` → `src/components/`
- `@stores` → `src/stores/`
- `@services` → `src/services/`
- `@views` → `src/views/`
- `@routes` → `src/router/routes/`
- `@modules` → `src/modules/`
- `@utils` → `src/utils/`

## Not Included

The following templates were excluded due to complex external dependencies:
- Action Bar Block (requires navbar-block)
- Add Payment Method Block (requires feedback component)
- Create Drawer Block (requires action-bar dependencies)
- Dialog Unsaved (template doesn't exist)
- Dialogs Block (template doesn't exist)
- Edit Drawer Block (complex dependencies)
- Empty Drawer (requires feedback component)
- Form Fields Inputs (template doesn't exist)
- Graphs Card Block (requires chart libraries)
- Home Cards Block (template doesn't exist)
- Info Drawer Block (requires feedback component)
- Main Menu Block (requires navbar-block)
- Signup Block (template doesn't exist)

## Technology Stack

- **Framework**: Vue 3.5.22
- **UI Library**: PrimeVue 3.35.0
- **Styling**: Tailwind CSS 3.3.3
- **Build Tool**: Vite 6.4.2
- **Storybook**: 8.6.18
- **Theme**: @aziontech/theme
- **Icons**: @aziontech/icons
- **Deployment**: Azion Edge Network

## Notes

- Stories follow the same structure as the webkit storybook
- All templates use Vue 3 Composition API
- Dark mode is enabled by default
- Components support PrimeVue's theming system
- Commands can be run from the root directory with `yarn storybook:*` prefix, or from the `storybook/` directory directly with `yarn <command>`
