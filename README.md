# azion-platform-kit

## Introdução
O Azion Platform Kit é um kit de desenvolvimento front-end composto pelas tecnologias utilizadas compostas por uma gama de Tecnologias e estrutura com a finalidade de facilitar a construção de novas rotas e páginas do Real Time Manager.

## Features
1. **Multi-tenancy:** Construa conforme a sua necessidade o seu Real Time Manager consumindo os endpoints da nossa API Pública: [Azion Public API](https://api.azion.com)
2. **UI Customizável:** configure tokens de temas ou os gere automaticamente via [Builder](https://designer.primevue.org/) em seu projeto dando o look and feel de acordo com a sua necessidade.
3. **Estrutura simples:** separação em camadas dos blocks, components e serviços de forma que sejá fácil construir uma nova rota em pouquíssimo tempo.

## What is a multi-tenant application?

Applicações Multi-tenant servem multiplos clientes através de diferentes domínios & subdomínios customizados com uma codebase unificada.

## How to start
Você precisa da NodeJS acima da versão 18.* instalada em seu computador, ou uma imagem Docker com esta versão de Node ou superior.

Instalando localmente:
- Clone este repositório
- Execute ```npm install``` ou ```yarn install```
- Execute ```npm run dev``` ou ```yarn dev```

A aplicação rodará no endereço: ```http://127.0.0.1:5173``` 

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Development
A estrutura segue o seguinte padrão:
```
├── App.vue
├── assets
│   └── themes
├── router
│   └── index.js
├── services
│   ├── axios
│   ├── domains-services
│   ├── edge-application-services
│   └── variables-services
├── stores
├── templates
│   ├── create-form-block
│   ├── footer-block
│   ├── list-table-block
│   ├── main-menu-block
│   └── shell-block
└── views
    └── EdgeApplications
        ├── ListView.vue
        └── CreateView.vue
    └── Variables
        ├── ListView.vue
        └── FormView.vue
```
 
Onde, tomando como exemplo a rota de *Variables*, temos o seguinte fluxo para implementação para a **Listagem**:

1. Criação do Serviço
    - *src/services/variables-services*
        - *make-variables-base-url.js*: método getter da URL base da API de Variables.
        - *index.js*: interface de exposição dos métodos (Listar, Editar, Excluir, Inserir)
        - *list-variables-service.js*: camada para chamada da API (endpoint de Listagem) e tratamento de retorno do payload (normalização, adição de helper, etc)
2. Criação da View 
    - *ListView.vue*: através da seleção de um dos blocos (nesse exemplo: *src/templates/list-table-block*) é realizada a implementação lógica mais detalhada se necessário.
3. Criação da Rota:
    - *src/router/index.js*: passagem junto da rota das properties de serviço que já foram implementadas para o componente.
2. Adição no Menu (opcional)
    - *src/main-menu-block*: configuração da rota, nome e ícone que serão mostrados no Sidemenu (se necessário).


## Another stuff
### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Deploy
Para executar o deploy você pode utilizar o Azion CLI ou o Vulcan:

Azion CLI (>= 0.70.0):
```
azioncli edge_applications init --name vueApp --type vue --mode deliver

azioncli edge_applications build

azioncli edge_applications publish

```

Vulcan:
```
vulcan build --preset vue --mode deliver

DEBUG=true vulcan deploy

DEBUG=true vulcan storage sync
```
