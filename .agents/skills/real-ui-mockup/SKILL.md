---
name: real-ui-mockup
description: Gera mockups e capturas visuais 100% fiéis de pixels reais da aplicação em execução (Google Chrome Headless via CDP), sem alucinações de IA gerativa. Suporta emulação de dispositivos (iPhone, Android, Samsung Tab, Desktop), injeção de estados/dados em tempo de execução e criação de componentes temporários com limpeza automática.
---

# Real UI Mockup Skill

Esta skill é responsável por gerar **mockups visuais e capturas de tela 100% fiéis de pixels reais** a partir do código React/Vite/Tailwind em execução no navegador real, garantindo fidelidade total à identidade visual, fontes, espaçamentos e componentes do projeto.

> [!IMPORTANT]
> **REGRA FUNDAMENTAL: PROIBIDO USAR IA GERATIVA DE IMAGENS (`generate_image`)**
> Imagens geradas por modelos de difusão de IA criam textos tortos, botões alucinados, logotipos deformados e layouts que não correspondem ao código. 
> Todos os mockups gerados por esta skill **DEVEM** ser capturas de pixels reais executadas pelo **Google Chrome Headless** via protocolo **Chrome DevTools Protocol (CDP)**.

---

## 1. Quando Acionar Esta Skill

Ative esta skill sempre que o usuário pedir:
- *"Gere um mockup da tela X"* ou *"Como ficaria essa tela no mobile e no tablet?"*
- *"Tire prints/mockups de todas as visões do sistema"*
- *"Crie uma prévia de um novo botão/componente para eu ver como fica antes de aprovar"*
- *"Valide visualmente se os botões cabem na tela de 390px sem quebra"*
- *"Gere imagens reais para colocar na documentação/PRD"*

---

## 2. Os 3 Modos de Operação para Mockups

Dependendo do objetivo do usuário, escolha o modo mais adequado:

### Modo 1: Captura de Telas e Estados Existentes (Zero Alteração no Código)
Usado para demonstrar telas que já existem na aplicação (ex: tela de Login, Modal de Entrada, Púlpito com duas folhas, Cabine do Obreiro).
- O script conecta ao Chrome headless em `localhost:3000`.
- Injeta manipulação de estado em tempo de execução (`sessionStorage`, navegação ou cliques nos botões).
- Captura os prints diretamente.
- **Impacto no Git:** 0 arquivos alterados.

### Modo 2: Mockup com Injeção de Dados/Estilos em Tempo de Execução (Zero Alteração em Disco)
Usado para demonstrar como uma tela existente se comporta com dados extremos (ex: 50 visitantes cadastrados, um aviso de emergência ativo no púlpito, ou uma cor de botão alternativa).
- O script injeta JavaScript no DOM via `Runtime.evaluate`:
  ```javascript
  // Exemplo: injetar dados mockados no sessionStorage ou disparar ações
  sessionStorage.setItem('docs_church_session', JSON.stringify({
    code: 'CUL-DOM',
    role: 'pastor',
    expiresAt: Date.now() + 10000000
  }));
  location.reload();
  ```
- **Impacto no Git:** 0 arquivos alterados.

### Modo 3: Mockup de Novo Componente / Ideia de Design (Sandbox com Limpeza Automática)
Usado quando o usuário quer **ver o mockup de uma funcionalidade ou componente novo que ainda NÃO existe no código**.
1. **Criar Rota ou Componente Temporário:**
   Crie um arquivo temporário no projeto (ex: `src/components/_sandbox/MockupPreview.tsx`) e monte-o temporariamente no `App.tsx` ou em uma rota de teste.
2. **Renderização Instantânea:**
   O Vite compila o componente em milissegundos via Hot Module Replacement (HMR).
3. **Captura dos Pixels Reais:**
   O script do Chrome headless abre a tela no dispositivo desejado (mobile, tablet ou desktop) e salva o print `.png` na pasta de artefatos.
4. **Limpeza Obrigatória do Código:**
   Logo após a captura bem-sucedida da imagem, desfaça imediatamente a alteração no código:
   ```bash
   rm -rf src/components/_sandbox
   git checkout src/App.tsx
   ```
   **Resultado:** O usuário recebe a imagem do mockup 100% perfeita e real no chat, enquanto a árvore de arquivos do Git permanece perfeitamente limpa e sem código residual!

---

## 3. Presets de Dispositivos Suportados

O script nativo da skill (`scripts/mockup-runner.cjs`) já possui presets calibrados para as resoluções da congregação:

| Preset | Resolução | Fator de Escala | Dispositivo Real Simulado |
| :--- | :--- | :--- | :--- |
| `mobile` | `390 × 844` | `2.0` (Retina) | iPhone 14 / 15 / 16 |
| `mobile-android`| `360 × 800` | `2.0` (HD) | Samsung Galaxy Linha A/S |
| `tablet` | `1280 × 800` | `1.5` | Samsung Tab A9 / Tab E (Púlpito em Paisagem) |
| `desktop` | `1440 × 900` | `1.0` | MacBook Air / Pro 13" e 14" |
| `desktop-hd` | `1920 × 1080` | `1.0` | Monitor Externo / Full HD |

---

## 4. Como Executar o Mockup Runner

A skill dispõe do utilitário autônomo em `.agents/skills/real-ui-mockup/scripts/mockup-runner.cjs`.

### Opção A: Executar via Arquivo de Configuração JSON
Crie um arquivo JSON com as cenas e execute:
```bash
node .agents/skills/real-ui-mockup/scripts/mockup-runner.cjs --config=caminho/para/cenas.json
```

### Opção B: Script Rápido em Node.js no Scratch
Para testes ad-hoc durante a conversa, o agente pode escrever um script pontual na pasta `scratch/` importando `{ runMockup }`:
```javascript
const { runMockup } = require('./.agents/skills/real-ui-mockup/scripts/mockup-runner');

await runMockup({
  scenes: [
    {
      name: 'Prévia Nova',
      viewport: 'mobile',
      output: '/caminho/absoluto/brain/.../mockup.png'
    }
  ]
});
```

---

## 5. Exibição e Entrega ao Usuário

Após capturar as imagens em formato PNG:
1. Garanta que a imagem esteja copiada na raiz da pasta de artefatos do Antigravity (`<appDataDir>/brain/<conversation-id>/nome_da_imagem.png`).
2. Apresente no chat utilizando a sintaxe obrigatória:
   ```markdown
   ![Nome do Mockup](/Users/.../brain/<conversation-id>/nome_da_imagem.png)
   ```
3. Explique sucintamente os pontos visuais demonstrados no mockup (responsividade, padding, contraste de cores, comportamento de quebra de linha).
