# Como Voltar para Produção (Reverter o Revert)

## Situações possíveis

### Situação 1: PR de revert ainda NÃO foi mergeado

**Solução**: Não faça nada. O código continua em produção.

- Não mergeie o PR `revert-deploy-2026-04-28`
- Feche o PR se quiser
- O deploy original permanece em `main`

---

### Situação 2: PR de revert JÁ foi mergeado

**Objetivo**: Desfazer o revert (voltar o deploy para `main`)

```bash
# 1. Atualizar main
git checkout main
git pull origin main

# 2. Criar nova branch
git checkout -b reapply-deploy-2026-04-28

# 3. Encontrar o hash do commit de revert
git log --oneline -10
# Procure por: "Revert 'Merge pull request #3497 from aziontech/dev'"
# Copie o hash (exemplo: 1d9ff7248)

# 4. Reverter o revert
git revert <hash-do-commit-revert>

# 5. Push e criar PR
git push origin reapply-deploy-2026-04-28
```

---

### Situação 3: Usar cherry-pick do merge original

Alternativa ao revert do revert:

```bash
# 1. Atualizar main
git checkout main
git pull origin main

# 2. Criar branch
git checkout -b reapply-deploy-2026-04-28

# 3. Cherry-pick o merge original
git cherry-pick -m 1 ac02738e2

# 4. Resolver conflitos se houver
git status
# Editar arquivos conflitantes
git add .
git cherry-pick --continue

# 5. Push e criar PR
git push origin reapply-deploy-2026-04-28
```

---

## Fluxo visual do processo

```
Estado inicial:
main: A → B → C → D (deploy ac02738e2)

Depois do revert:
main: A → B → C → D → E (revert do deploy 1d9ff7248)

Para voltar para produção:
main: A → B → C → D → E → F (revert do revert)
                                    ↑
                            Isso traz de volta o deploy D
```

---

## Como encontrar o hash do commit de revert

### Opção 1: Ver histórico recente
```bash
git log --oneline -10
```

### Opção 2: Buscar por "Revert"
```bash
git log --oneline --grep="Revert" -5
```

### Opção 3: Ver histórico completo
```bash
git log --oneline --graph --all -15
```

---

## Diferença entre Opção 2 e Opção 3

### Opção 2: `git revert` do revert
- Cria um novo commit que desfaz o revert
- Mais simples
- Menos chance de conflitos
- **Recomendado**

### Opção 3: `git cherry-pick` do merge original
- Aplica o merge original novamente
- Pode ter mais conflitos
- Útil se o revert foi feito de forma diferente
- Mais complexo

---

## Comandos práticos

### Verificar situação atual
```bash
git log --oneline -10 --graph
```

### Ver se o PR foi mergeado
```bash
# Ver se o commit de revert está em main
git branch --contains <hash-do-revert>
```

### Abortar se der errado
```bash
# Se estiver no meio de um cherry-pick
git cherry-pick --abort

# Se estiver no meio de um revert
git revert --abort
```

---

## Passo a passo completo (Recomendado)

### Se o PR de revert JÁ foi mergeado:

1. **Atualizar main**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Criar branch**
   ```bash
   git checkout -b reapply-deploy-2026-04-28
   ```

3. **Encontrar o commit de revert**
   ```bash
   git log --oneline --grep="Revert" -5
   # Exemplo de saída:
   # 1d9ff7248 Revert "Merge pull request #3497 from aziontech/dev"
   ```

4. **Reverter o revert**
   ```bash
   git revert 1d9ff7248 --no-edit
   ```

5. **Resolver conflitos se houver**
   ```bash
   git status
   # Ver arquivos conflitantes
   git add <arquivo-resolvido>
   git revert --continue --no-edit
   ```

6. **Push e criar PR**
   ```bash
   git push origin reapply-deploy-2026-04-28
   ```

7. **Criar PR no GitHub**
   - Branch: `reapply-deploy-2026-04-28` → `main`
   - Título: "Reapply DEPLOY-2026-04-28"
   - Body: "Reverting the revert to restore production deployment"

---

## Checklist

- [ ] Verificar se o PR de revert foi mergeado
- [ ] Atualizar main com `git pull`
- [ ] Criar branch nova
- [ ] Encontrar hash do commit de revert
- [ ] Executar `git revert <hash>`
- [ ] Resolver conflitos se necessário
- [ ] Push da branch
- [ ] Criar PR
- [ ] Aguardar aprovação e merge

---

## Exemplo real do seu caso

### Hash do deploy original:
```
ac02738e2 - Merge pull request #3497 (DEPLOY-2026-04-28)
```

### Hash do revert:
```
1d9ff7248 - Revert "Merge pull request #3497 from aziontech/dev"
```

### Para voltar para produção:
```bash
git checkout main
git checkout -b reapply-deploy-2026-04-28
git revert 1d9ff7248 --no-edit
git push origin reapply-deploy-2026-04-28
# Criar PR
```

---

## Resumo

- **PR não mergeado**: Não mergeie, código continua em produção
- **PR mergeado**: Reverter o revert com `git revert <hash>`
- **Sempre criar branch nova** a partir de `main` atualizada
- **Usar `--no-edit`** para não abrir editor
- **Resolver conflitos** com `git add` + `git revert --continue`

**Lembre-se**: Reverter um revert = voltar o código original para main.