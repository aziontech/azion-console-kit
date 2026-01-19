# Validação de Nomenclatura (kebab-case)

Este documento descreve como funciona a validação automática de nomes de arquivos e pastas no projeto.

---

## Padrão Adotado

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Pastas | kebab-case | `edge-applications/` |
| Arquivos | kebab-case | `list-domains-service.js` |

### Regex de Validação

```regex
^[a-z][a-z0-9]*(-[a-z0-9]+)*$
```

- Deve começar com letra minúscula
- Pode conter números
- Palavras separadas por hífen (-)
- Sem underscores, espaços ou maiúsculas

---

## Como Usar

### Validar Manualmente

```bash
# Verificar se há arquivos fora do padrão
yarn lint:naming

# Ver sugestões de correção
yarn lint:naming:fix
```

### Exemplo de Saída

```bash
🔍 Validando convenção de nomenclatura (kebab-case)...

❌ Encontrados 3 arquivo(s)/pasta(s) fora do padrão:

📁 Pastas:
   src/services/EdgeApplications
   └─ Sugestão: edge-applications

📄 Arquivos:
   src/services/domains/ListDomainsService.js
   └─ Sugestão: list-domains-service.js
   src/services/domains/domainAdapter.js
   └─ Sugestão: domain-adapter.js

📖 Padrão esperado: kebab-case (ex: my-component.js, user-service.js)
```

---

## Integração Automática

### Pre-commit Hook

A validação roda automaticamente antes de cada commit via Husky:

```bash
# .husky/pre-commit
yarn lint:naming        # ← Validação de nomenclatura
yarn test:unit:coverage
yarn lint
yarn format
```

Se houver arquivos fora do padrão, o commit será bloqueado.

### CI/CD Pipeline

Adicionar ao workflow do GitHub Actions:

```yaml
# .github/workflows/lint.yml
- name: Validate naming convention
  run: yarn lint:naming
```

---

## Exceções (Ignorados)

### Arquivos Ignorados

| Padrão | Motivo |
|--------|--------|
| `index.js` | Barrels são permitidos |
| `*.test.js` | Testes podem ter outro padrão |
| `*.spec.js` | Specs podem ter outro padrão |
| `.env`, `.gitignore` | Arquivos de configuração |
| `README.md` | Documentação |

### Pastas Ignoradas

| Pasta | Motivo |
|-------|--------|
| `node_modules/` | Dependências |
| `dist/` | Build |
| `coverage/` | Relatórios de cobertura |
| `__tests__/` | Padrão Jest |
| `__mocks__/` | Padrão Jest |

---

## Configuração

O script pode ser configurado em `scripts/validate-naming-convention.js`:

```javascript
const CONFIG = {
  // Diretórios para validar
  includePaths: [
    'src/services',
    'src/views',
    'src/components',
    'src/composables',
    'src/helpers'
  ],

  // Padrões para ignorar
  ignorePaths: [
    'node_modules',
    '.git',
    'dist'
  ],

  // Arquivos para ignorar (regex)
  ignoreFiles: [
    /^index\.js$/,
    /\.test\.js$/
  ]
}
```

---

## Alternativa: ESLint Plugin

Para integrar diretamente no ESLint, instalar o plugin `eslint-plugin-check-file`:

```bash
yarn add -D eslint-plugin-check-file
```

Adicionar ao `.eslintrc.cjs`:

```javascript
module.exports = {
  plugins: ['check-file'],
  rules: {
    'check-file/filename-naming-convention': [
      'error',
      {
        '**/*.{js,vue}': 'KEBAB_CASE'
      },
      {
        ignoreMiddleExtensions: true
      }
    ],
    'check-file/folder-naming-convention': [
      'error',
      {
        'src/**/': 'KEBAB_CASE'
      }
    ]
  }
}
```

---

## Correção de Arquivos Existentes

Para renomear arquivos fora do padrão:

```bash
# Exemplo: renomear com git mv (preserva histórico)
git mv src/services/ListDomainsService.js src/services/list-domains-service.js

# Renomear pasta
git mv src/services/EdgeApplications src/services/edge-applications
```

### Script de Correção em Massa

```bash
# Listar arquivos para corrigir
yarn lint:naming:fix

# Renomear manualmente usando as sugestões
# (não há rename automático para evitar quebras)
```

---

## FAQ

### Por que kebab-case?

1. **Evita conflitos** em sistemas case-insensitive (Windows/macOS)
2. **Recomendado pelo Vue.js** Style Guide
3. **Consistente** com CSS e URLs
4. **Git-friendly** - não gera conflitos de rename

### Posso usar PascalCase para componentes?

Para arquivos `.vue`, alguns projetos usam PascalCase. Se preferir, ajuste a configuração:

```javascript
// Em validate-naming-convention.js
ignoreFiles: [
  /\.vue$/, // Ignora arquivos Vue
]
```

### E os arquivos de teste?

Arquivos `.test.js` e `.spec.js` são ignorados por padrão. Você pode seguir o mesmo padrão kebab-case ou manter junto ao arquivo testado.

---

*Documentação criada em Janeiro 2026*
