# Template da Matriz de Rastreabilidade de Requisitos (RTM)

Utilize este formato oficial para registrar a auditoria forense de qualquer especificação, PRD, plano de fase ou prompt litúrgico.

---

## Estrutura da Matriz Forense RTM

```markdown
### 📋 Relatório de Conformidade da Especificação (RTM Gate)

| ID | Categoria | Requisito da Especificação | Arquivo Implementado | Linhas Exatas | Evidência Comprovada | Status |
|:---|:---|:---|:---|:---:|:---|:---:|
| `LIT-01` | Liturgia/Negócio | [Descrição concisa da regra de negócio litúrgica] | [`NomeArquivo.ts`](file:///caminho/completo) | `L10-L35` | [Ex: 5 blocos padronizados sincronizados com fila otimista] | ✅ CONFORME |
| `UI-01` | Interface Púlpito | [Descrição do componente ou visão do pastor/obreiro] | [`Componente.tsx`](file:///caminho/completo) | `L45-L60` | [Ex: Spread de 2 páginas montado em paisagem sem scroll] | ✅ CONFORME |
| `SEC-01` | Segurança Serverless | [Descrição da salvaguarda de segurança] | [`api/arquivo.ts`](file:///caminho/completo) | `L20-L40` | [Ex: Prepared statements e validação de token HMAC-SHA256] | ✅ CONFORME |
| `COMPAT-01` | Android KitKat | [Descrição da compatibilidade WebView legado] | [`Componente.tsx`](file:///caminho/completo) | `L15-L30` | [Ex: Estilos declarados estritamente em Hex/RGB, zero oklch] | ✅ CONFORME |
| `DATA-01` | Sincronização/Cache | [Descrição da resiliência offline/fila] | [`useHook.ts`](file:///caminho/completo) | `L50-L75` | [Ex: Rascunho salvo em localStorage sem requisições HTTP] | ✅ CONFORME |

---

### 🛡️ Resultado do Script de Integridade Determinístico
- **Comando Executado:** `python3 scripts/verify-spec-integrity.py`
- **Componentes Órfãos:** 0 detectados
- **Barrels sem Consumo Real:** 0 detectados
- **Regras do AGENTS.md (Linhas <= 200, Zero Drivers no Client, KitKat):** Conforme
- **TypeScript & Build:** Aprovado (`tsc` limpo e build sem vazamento no `dist/`)
```

---

## Categorias Padrão de Requisitos do Painel do Culto

1. **`LIT-XX` (Regras de Negócio e Liturgia Congregacional):**
   - 5 blocos litúrgicos (`visitors`, `prayers`, `prayers_youtube`, `opportunities`, `choirs`).
   - Validação de PIN de 4 dígitos para Controlador e tokens HMAC-SHA256.
   - Resolução de conflitos de sala (Abrir Existente vs Sobrescrever Culto).
   - Pedidos de oração urgentes (`isUrgent` com `#991B1B`).
   - Exportação Holyrics (slides solenes) e WhatsApp (negrito e cabeçalho oficial).

2. **`UI-XX` (Interface do Púlpito, Obreiro e Mesa):**
   - Princípio Púlpito Zen: sem sombras volumosas ou animações distrativas.
   - Zero scroll vertical no púlpito em modo paisagem (leitura estilo livro aberto de 2 páginas).
   - Componentes modais sempre desacoplados em arquivos dedicados (zero modais inline).

3. **`SEC-XX` (Fronteira Serverless & Prevenção de IDOR):**
   - Zero drivers `@neondatabase/serverless` ou `pg` no client `src/`.
   - Comunicação exclusiva por prepared statements (`$1`, `$2`).
   - Zero `SELECT *` em tabelas contendo credenciais ou PIN.

4. **`COMPAT-XX` (Compatibilidade Android 4.4.4 KitKat):**
   - Suporte para WebViews clássicas (Chrome 30-55).
   - Proibição de recursos modernos sem suporte clássico (zero `oklch()`, zero `subgrid`).
   - Cores estritamente em Hexadecimal ou RGB.

5. **`DATA-XX` (Fila Otimista, Estado e Resiliência Offline):**
   - Fila otimista sequencial (`blockMutationQueueRef`) com retentativa automática.
   - Rascunhos locais sem requisições HTTP (`docs_church_draft_${domain}_${roomId}`).
   - Cold start suave do banco Neon com feedback visual claro.
