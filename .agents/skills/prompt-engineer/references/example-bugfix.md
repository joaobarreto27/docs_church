# Exemplo de Prompt — Bugfix / Correção de Erro

Exemplo real de prompt para corrigir um erro de build (TypeScript type error).

---

## Exemplo: Correção de Type Error em Props

```
O build do Next.js está falhando devido a um Type Error de desalinhamento de props entre `src/app/page.tsx` e o componente filho renderizado na linha 562.

Recentemente, foi implementada a elevação de estado com a seguinte função:

​```typescript
const refreshMonthlyTransactions = async (month?: string, year?: string) => {
  try {
    const targetYear = year || String(new Date().getFullYear());
    const res = await getMonthlyTransactionsAction('all', targetYear);
    return res;
  } catch (err) {
    console.error('Erro ao buscar transações mensais:', err);
    return { transactions: [], selectedYear: String(new Date().getFullYear()) } as any;
  }
};
​```

Regras Determinísticas de Alteração:

1. LOCALIZAR O COMPONENTE FILHO:
   - Identifique o componente instanciado em `src/app/page.tsx` por volta da linha 560 (recebe `loadMetadata`, `yearsList` e `refreshMonthly`).

2. ATUALIZAR A INTERFACE DE PROPS:
   - Abra o arquivo do componente filho.
   - Atualize `expenseTypesWithCategories` para aceitar campo opcional `reserva`:
     ```typescript
     expenseTypesWithCategories: {
       value: string;
       category: string;
       reserva?: string | null;
     }[];
     ```
   - Adicione a assinatura de `refreshMonthly`:
     ```typescript
     refreshMonthly: (month?: string, year?: string) => Promise<{ transactions: any[]; selectedYear: string }>;
     ```

3. DESESTRUTURAÇÃO NO COMPONENTE:
   - Garanta que `refreshMonthly` seja adicionada na desestruturação dos argumentos.

RESTRIÇÕES:
- Não altere nenhuma outra lógica de negócios.
- Apenas sincronize tipagens entre pai e filho.
```

---

## Observações sobre Prompts de Bugfix

1. **Sem ROLE:** Bugfixes não precisam de persona. Vá direto ao problema.
2. **Código real:** Inclua o snippet exato que causa o erro.
3. **Localização precisa:** Mencione arquivo e linha aproximada.
4. **Escopo mínimo:** "Não altere nenhuma outra lógica" é restrição obrigatória.
5. **Tipo do erro:** Sempre especifique se é Type Error, Runtime Error, Build Error.
