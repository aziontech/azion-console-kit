# azion-platform-kit

## Introdução
O Azion Platform Kit é um kit de desenvolvimento front-end composto pelas tecnologias utilizadas compostas por uma gama de Tecnologias e estrutura com a finalidade de facilitar a construção de novas rotas e páginas do Real Time Manager.

## Características
1. **Multi-tenancy:** Construa conforme a sua necessidade o seu Real Time Manager consumindo os endpoints da nossa API Pública: [Azion Public API](https://api.azion.com)
2. **UI Customizável:** configure tokens de temas ou os gere automaticamente via [Builder](https://designer.primevue.org/) em seu projeto dando o look and feel de acordo com a sua necessidade.
3. **Estrutura simples:** separação em camadas dos blocks, components e serviços de forma que sejá fácil construir uma nova rota em pouquíssimo tempo.

## O que é uma aplicação multi-tenant?

Applicações Multi-tenant servem multiplos clientes através de diferentes domínios & subdomínios customizados com uma codebase unificada.

## Como executar
Você precisa da NodeJS acima da versão 18.* instalada em seu computador, ou uma imagem Docker com esta versão de Node ou superior.

Instalando localmente:
- Clone este repositório
- Execute ```npm install``` ou ```yarn install```
- Execute ```npm run dev``` ou ```yarn dev```

A aplicação rodará no endereço: ```http://127.0.0.1:5173``` 

## Configuração recomendada na sua IDE

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


## Extras
### Compilar e Minificar para produção

```sh
yarn build
```

### Executar testes unitários com [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Executar testes e2e com [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

Esse comando executa os testes e2e em um servidor de desenvolvimento Vite.
Sendo muito mais rápido que um build para produção.

Embora ainda seja recomendado executar os testes no código buildado para produção com `test:e2e` antes de executar o deploy (ex.: ambientes de CI):

```sh
yarn build
yarn test:e2e
```

### Formatação com [ESLint](https://eslint.org/)

```sh
yarn lint
```

### Deploy manual (First deploy)
Para executar o deploy você pode utilizar o Azion CLI:

Azion CLI (>= 0.70.0):
```
yarn build

azioncli edge_applications init --name azion-platform-kit --type vue --mode deliver

azioncli edge_applications publish --debug

```
### Deploy com GitHub Workflow
Para usufruir do GitHub Workflow você precisa ter configurado dentro do seu repositório as seguintes SECRETS:
- PLATFORM_KIT_TOKEN: seu Personal token da Azion para ser utilizado no CLI durante o deploy.
- APPLICATION_ID: ID da Edge Application criada anteriormente via first deploy.
- FUNCTION_ID: ID da Edge Function criada anteriormente via first deploy.
- DOMAIN_ID: ID do Domain vinculado a Edge Application criado anteriormente via first deploy.

---
<font color=#ff9900>* As informações sobre os ID's necessários para os SECRETS estarão disponíveis dentro do arquivo ```azion/azion.json``` após o first deploy.</font>

### Issues conhecidas na versão 0.7.0 da azioncli
Devido à incompatibilidades com o vite na versão atual da azioncli os problemas abaixo podem ocorrer:

- No fluxo de deploy, na primeira vez, a cli acaba não criando o diretório `.edge/statics` e retorna uma mensagem de erro no terminal. Para solucionar esse problema, execute: 
```sh
  mkdir .edge/statics && cp -r dist/* .edge/statics
  azioncli edge_applications publish                     
```

- Já nos casos de edição da edge application, os estáticos gerados em `dist` não sobrescrevem os que estão em `.edge/statics`. Antes publicar a edge application pela cli, verifique se os arquivos em `dist` e `.edge/statics` possuem o mesmo nome/conteúdo. Para solucionar esse problema, execute: 
```sh
  rm -rf .edge/statics/* && cp -r dist/* .edge/statics
  azioncli edge_applications publish                      
```

### Outros links

[vee-validate guide](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/)
[yup with vee-valide guide](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/#validating-with-yup)
