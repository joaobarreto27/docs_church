# Template de Fase — 7 Seções Padronizadas

Mesmo template usado em `doc-generator`. Copiado aqui para independência de referência.

---

```markdown
# Plano de [Refatoração/Implementação] - Fase [X]: [NOME DA FASE]

## 1. Objetivo da Fase
- [Descrição + impacto esperado com métricas]

## 2. Escopo de Arquivos Afetados
### Arquivos criados:
### Arquivos modificados:
### Arquivos removidos (se aplicável):

## 3. Padrões e Princípios Aplicados
- [Pattern/Princípio]: [Como se aplica]

## 4. Passo a Passo Técnico de Implementação
### 4.1. [Ação 1]
### 4.2. [Ação 2]

## 5. Exemplo de Código (Antes vs. Depois)
### Antes:
### Depois:

## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)
> Preencha ou "Nenhuma anomalia identificada."

## 7. Critérios de Aceite e Verificação
- [ ] Build passa
- [ ] Comportamento funcional mantido
- [ ] [Critérios específicos]
```

---

## Meta de Qualidade

- **300-475 linhas** por documento
- **5+ referências** a linhas de código real
- **2+ pares** Antes/Depois com código real
- **5+ critérios** de aceite
