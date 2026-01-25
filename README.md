<h1 align="center">
  Azion Console Kit 💻🚀🧡
</h1>

<p align="center">
  <strong>A modern, customizable front-end development kit for building edge computing interfaces</strong>
</p>

<p align="center">
  <a href="#introduction-">Introduction</a> •
  <a href="#tech-stack-">Tech Stack</a> •
  <a href="#getting-started-">Getting Started</a> •
  <a href="#project-structure-">Project Structure</a> •
  <a href="#configuration-">Configuration</a> •
  <a href="#testing-">Testing</a> •
  <a href="#contributions-">Contributions</a>
</p>

---

## Introduction 📖

**Azion Console Kit** is a front-end development kit made in Vue/Vite with the PrimeVue and Tailwind framework that allows you to run a customized [Azion Console](https://console.azion.com/) interface.

This project was developed by Azion, an edge computing platform that allows you to build and run applications anywhere. You'll find our products and services on it. 🚀

## Tech Stack 🛠️

| Technology | Purpose |
|------------|---------|
| [Vue 3](https://vuejs.org/) | Progressive JavaScript framework |
| [Vite](https://vitejs.dev/) | Next-generation frontend tooling |
| [PrimeVue](https://primevue.org/) | UI component library |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [Pinia](https://pinia.vuejs.org/) | State management |
| [Vue Router](https://router.vuejs.org/) | Official router for Vue.js |
| [Axios](https://axios-http.com/) | HTTP client |
| [Vitest](https://vitest.dev/) | Unit testing framework |
| [Cypress](https://www.cypress.io/) | E2E testing framework |
| [VeeValidate](https://vee-validate.logaretm.com/v4/) + [Yup](https://github.com/jquense/yup) | Form validation |

## Getting Started 🔛

### Requirements

Before you begin, ensure that you have the following:

- [Node.js](https://nodejs.org/) version **22.18.0** or later
- [Yarn](https://yarnpkg.com/) version **1.22.22** or later

> **Note:** Check `.nvmrc` for the exact Node.js version used in development.

#### Using Docker (Alternative)

If you prefer not to install Node.js and Yarn locally, you can use Docker:

```bash
alias yarn="docker run -it --rm -p 5173:5173 -v $HOME:/root -v $PWD:/usr/src/app -w /usr/src/app node:22 yarn"
```

### Setup

1. **Clone the repository:**

   ```bash
   git clone git@github.com:aziontech/azion-console-kit.git
   cd azion-console-kit
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Start the development server:**

   ```bash
   yarn dev --host
   ```

4. **Access the application:**

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure �

```
src/
├── assets/          # Static files (CSS, images, themes)
├── components/      # Reusable Vue components
├── composables/     # Vue 3 composition API utilities
├── helpers/         # Utility functions and helpers
├── layout/          # Layout components (header, sidebar, etc.)
├── modules/         # Feature modules
├── plugins/         # Vue plugins configuration
├── router/          # Route definitions
├── services/        # API service layer (Axios calls)
├── stores/          # Pinia state management stores
├── templates/       # Reusable page templates/blocks
├── tests/           # Unit tests
├── utils/           # General utilities
└── views/           # Page components (organized by feature)
```

### Key Directories Explained

| Directory | Description |
|-----------|-------------|
| `services/` | API integration layer. Each feature has its own service folder with CRUD operations |
| `views/` | Page components organized by module (e.g., `EdgeApplications/`, `Variables/`) |
| `templates/` | Pre-built blocks for common UI patterns (list tables, forms, etc.) |
| `stores/` | Shared state between components using Pinia |
| `router/` | Centralized routing with `index.js` and feature-specific route files |

## Configuration 💻

### Environment Variables

Create a `.env` file at the root of your project:

```bash
# API Environment (stage or production)
VITE_ENVIRONMENT=stage

# Stripe Keys (for payment processing)
VITE_STRIPE_TOKEN_DEV=pk_test_yourDevApiKeyHere
VITE_STRIPE_TOKEN_STAGE=pk_test_yourStageApiKeyHere
VITE_STRIPE_TOKEN_PROD=pk_live_yourProductionApiKeyHere
```

| Variable | Description |
|----------|-------------|
| `VITE_ENVIRONMENT` | API stack to use: `stage` (default) or `production` |
| `VITE_STRIPE_TOKEN_DEV` | Stripe API key for local development |
| `VITE_STRIPE_TOKEN_STAGE` | Stripe API key for staging environment |
| `VITE_STRIPE_TOKEN_PROD` | Stripe API key for production |

### IDE Setup (Recommended)

For the best development experience with VSCode:

1. Install recommended extensions:
   - [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur)
   - [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

2. Enable format on save in `.vscode/settings.json`:

```json
{
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Testing 🧪

### Unit Tests

```bash
# Run tests with UI
yarn test:unit

# Run tests headless
yarn test:unit:headless

# Run tests with coverage
yarn test:unit:coverage
```

### E2E Tests (Cypress)

Before running E2E tests, create `cypress.env.json` from the example file and fill in valid credentials.

```bash
# Open Cypress UI (development)
yarn test:e2e:open:dev

# Run tests headless (development)
yarn test:e2e:run:dev

# Run against staging
yarn test:e2e:run:stage

# Run against production
yarn test:e2e:run:prod
```

### Linting & Formatting

```bash
# Lint and fix issues
yarn lint

# Format code with Prettier
yarn format

# Security check
yarn security-check
```

## Running on the Edge 🚀

Deploy to Azion's edge platform using the Azion CLI:

1. **Install and configure Azion CLI:**

   [Download the Azion CLI](https://www.azion.com/en/documentation/products/azion-cli/overview/) and authenticate:

   ```bash
   azion -t ${PERSONAL_TOKEN}
   ```

2. **Link the project:**

   ```bash
   azion link
   ```

   Select the **Vue** preset when prompted.

3. **Deploy:**

   ```bash
   azion deploy
   ```

> 💡 **Tip:** Use `--config-dir` to manage multiple environments (e.g., staging vs production).

## Available Scripts 📜

| Script | Description |
|--------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn preview` | Preview production build locally |
| `yarn test:unit` | Run unit tests with UI |
| `yarn test:e2e:open:dev` | Open Cypress for E2E testing |
| `yarn lint` | Lint and fix code |
| `yarn format` | Format code with Prettier |

## Features 🧩

- **Multi-tenancy:** Build your Azion Console by consuming endpoints from the [Azion Public API](https://api.azion.com/)
- **Customizable UI:** Configure theme tokens or generate them automatically via the Builder
- **Simple structure:** Layered separation of blocks, components, and services for easy route building
- **Edge-ready:** Deploy directly to Azion's edge network

## Troubleshooting 🔧

### Common Issues

**Port 5173 already in use:**
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
```

**Node version mismatch:**
```bash
# Use nvm to switch to the correct version
nvm use
```

**Dependencies out of sync:**
```bash
# Clean install
rm -rf node_modules yarn.lock
yarn install
```

## Contributions 🤝

We welcome contributions! Before starting, please read:

| Resource | Description |
|----------|-------------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute and submit PRs |
| [DEVELOPER.md](DEVELOPER.md) | Development environment setup and architecture |
| [SECURITY.md](SECURITY.md) | Security validation process |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community guidelines |

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run `yarn lint` and `yarn test:unit`
5. Commit using [conventional commits](https://www.conventionalcommits.org/)
6. Push and open a Pull Request

## Community 💬

Join our community:

- [Discord](https://discord.com/invite/Yp9N7RMVZy) - Chat with the team and community
- [X (Twitter)](https://twitter.com/aziontech) - Latest updates
- [LinkedIn](https://www.linkedin.com/company/aziontech) - Company news
- [YouTube](https://www.youtube.com/aziontech) - Tutorials and demos

## License 📄

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.
