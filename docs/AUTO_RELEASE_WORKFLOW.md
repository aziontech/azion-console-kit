# Automatic Release Workflow

Este documento descreve o workflow de GitHub Actions para geração automática de releases após deploys bem-sucedidos.

## 📋 Visão Geral

O workflow `auto-release.yml` automatiza a criação de releases no GitHub imediatamente após a conclusão bem-sucedida de um deploy, garantindo consistência entre o artefato implantado e a release publicada.

## 🚀 Funcionalidades

### ✨ Principais Recursos

- **Trigger Automático**: Executa automaticamente após workflows de deploy
- **Versionamento Semântico**: Gera versões baseadas em commits e ambiente
- **Release Notes Automáticas**: Cria notas de release baseadas no histórico de commits
- **Suporte Multi-Ambiente**: Diferentes estratégias para produção, staging e desenvolvimento
- **Tratamento de Erros**: Notificações e criação de issues em caso de falha

### 🎯 Triggers

O workflow é acionado por:

1. **Conclusão de Workflow de Deploy** (automático)
   - Branches: `main`, `production`, `release/*`
   - Apenas quando o deploy é bem-sucedido

2. **Execução Manual** (workflow_dispatch)
   - Permite escolher o ambiente
   - Opção de forçar release mesmo com deploy falhado

## 🔧 Configuração

### Permissões Necessárias

```yaml
permissions:
  contents: write      # Para criar releases e tags
  issues: write        # Para criar issues em caso de erro
  pull-requests: read  # Para ler informações de PRs
  actions: read        # Para acessar status de workflows
```

### Variáveis de Ambiente

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `NODE_VERSION` | `18` | Versão do Node.js |
| `RELEASE_BRANCH` | `main` | Branch principal para releases |

### Secrets Necessários

- `GITHUB_TOKEN`: Token padrão do GitHub (automático)

## 📦 Estratégia de Versionamento

### Versionamento Semântico

O workflow utiliza análise de commits para determinar o tipo de versão:

- **Major** (`x.0.0`): Commits com `BREAKING CHANGE`
- **Minor** (`x.y.0`): Commits com `feat:`
- **Patch** (`x.y.z`): Outros commits (fixes, chores, etc.)

### Ambientes e Versões

| Ambiente | Formato da Versão | Prerelease |
|----------|-------------------|------------|
| `production` | `1.2.3` | ❌ |
| `staging` | `1.2.3-staging.20231215123045` | ✅ |
| `development` | `1.2.3-development.20231215123045` | ✅ |
| `release/*` | `1.2.3-release.20231215123045` | ✅ |

## 📝 Geração de Release Notes

### Categorias de Mudanças

As release notes são organizadas automaticamente por:

- **✨ New Features**: Commits com `feat:`
- **🐛 Bug Fixes**: Commits com `fix:`
- **⚠️ Breaking Changes**: Commits com `BREAKING CHANGE`
- **🔧 Other Changes**: `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`
- **👥 Contributors**: Lista de contribuidores

### Exemplo de Release Notes

```markdown
## 🚀 Release Notes

**Environment:** production
**Deployed Commit:** [abc123](https://github.com/repo/commit/abc123)
**Deployment Date:** 2023-12-15 12:30:45 UTC

### 📋 Changes

#### ✨ New Features
- feat: add automatic release workflow
- feat: implement user authentication

#### 🐛 Bug Fixes
- fix: resolve deployment timeout issue
- fix: correct validation error handling

#### 👥 Contributors
- @developer1
- @developer2

### 📦 Deployment Information

- **Status:** ✅ Successfully Deployed
- **Environment:** production
- **Workflow:** [View Deployment Logs](https://github.com/repo/actions/runs/123)

---

*This release was automatically generated after a successful deployment.*
```

## 🔄 Fluxo de Execução

### Jobs do Workflow

1. **check-deployment**
   - Verifica status do deploy
   - Determina se deve criar release
   - Identifica ambiente e commit

2. **generate-version**
   - Analisa commits desde última tag
   - Calcula nova versão semântica
   - Define se é prerelease

3. **generate-release-notes**
   - Coleta commits desde última release
   - Categoriza mudanças
   - Gera notas formatadas

4. **create-release**
   - Cria tag e release no GitHub
   - Atualiza package.json (produção)
   - Notifica sucesso

5. **notify-failure** (se necessário)
   - Notifica falhas
   - Cria issue para investigação

## 🛠️ Uso e Exemplos

### Execução Automática

O workflow executa automaticamente após qualquer deploy bem-sucedido:

```yaml
# No seu workflow de deploy
name: Deploy
on:
  push:
    branches: [main]
# ... jobs de deploy
```

### Execução Manual

Para executar manualmente:

1. Vá para Actions → Automatic Release After Deploy
2. Clique em "Run workflow"
3. Selecione o ambiente
4. Opcionalmente force a criação mesmo com deploy falhado

### Padrões de Commit

Para versionamento correto, use commits convencionais:

```bash
# Patch version (1.0.0 → 1.0.1)
git commit -m "fix: resolve login issue"
git commit -m "chore: update dependencies"

# Minor version (1.0.0 → 1.1.0)
git commit -m "feat: add user dashboard"

# Major version (1.0.0 → 2.0.0)
git commit -m "feat: redesign API

BREAKING CHANGE: API endpoints have changed"
```

## 🔍 Troubleshooting

### Problemas Comuns

#### Release não foi criada

**Possíveis causas:**
- Deploy falhou
- Permissões insuficientes
- Conflito de versão

**Solução:**
1. Verifique logs do workflow de deploy
2. Confirme permissões do token
3. Execute manualmente se necessário

#### Versão incorreta gerada

**Possíveis causas:**
- Commits não seguem padrão convencional
- Tags existentes conflitantes

**Solução:**
1. Use commits convencionais
2. Verifique tags existentes
3. Execute com força se necessário

#### Falha na criação da tag

**Possíveis causas:**
- Tag já existe
- Permissões insuficientes

**Solução:**
1. Verifique se tag já existe
2. Delete tag conflitante se necessário
3. Confirme permissões de escrita

### Logs e Debugging

Para debugar problemas:

1. **Workflow Logs**: Actions → Workflow run → Job logs
2. **Issues Automáticas**: Criadas automaticamente em falhas
3. **Release History**: Releases → View all releases

## 📊 Monitoramento

### Métricas Importantes

- Taxa de sucesso de releases automáticas
- Tempo entre deploy e release
- Frequência de execuções manuais
- Issues criadas por falhas

### Alertas Recomendados

- Falhas consecutivas de release
- Execuções manuais frequentes
- Issues de release não resolvidas

## 🔒 Segurança

### Boas Práticas

- Use apenas `GITHUB_TOKEN` padrão
- Limite permissões ao mínimo necessário
- Monitore execuções não autorizadas
- Revise logs regularmente

### Auditoria

- Todas as releases são logadas
- Issues automáticas para falhas
- Histórico completo no GitHub

## 🚀 Próximos Passos

### Melhorias Futuras

- [ ] Integração com Slack/Teams para notificações
- [ ] Rollback automático em caso de problemas
- [ ] Métricas de deployment no release
- [ ] Validação de qualidade antes da release
- [ ] Suporte a múltiplos repositórios

### Customizações

O workflow pode ser customizado para:

- Diferentes estratégias de versionamento
- Formatos personalizados de release notes
- Integrações com ferramentas externas
- Validações específicas do projeto

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte os logs do workflow
2. Verifique issues automáticas criadas
3. Consulte a documentação do GitHub Actions
4. Entre em contato com a equipe de DevOps
