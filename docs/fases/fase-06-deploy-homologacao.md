# Fase 06: Homologação e Deploy Oficial na Vercel

Guia completo e checklist técnico de homologação para colocar o **Docs Church** em produção na **Vercel**, conectado ao banco serverless **Neon PostgreSQL** e acessível nos tablets do púlpito e smartphones da cabine.

---

## 1. Conexão e Configuração na Vercel

O projeto está 100% pronto para a Vercel através do arquivo [`vercel.json`](file:///Users/joaovitorbarreto/Projects/docs_church/vercel.json).

### Passo a Passo no Dashboard da Vercel:
1. Acesse [vercel.com](https://vercel.com) e clique em **Add New... > Project**.
2. Importe o repositório Git do projeto: `docs_church`.
3. Na seção **Build and Output Settings**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Na seção **Environment Variables**, adicione a variável:
   - **Nome:** `VITE_DATABASE_URL`
   - **Valor:** `postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require` (ou a string de conexão da sua branch ativa no Neon).
5. Clique em **Deploy**.

---

## 2. Checklist de Homologação em Produção

### ✅ A. Compatibilidade do Tablet Legado (Android 4.4.4 KitKat)
- [ ] Conectar o tablet antigo ao Wi-Fi da igreja.
- [ ] Abrir o navegador padrão (ou Chrome legado versão 30+).
- [ ] Acessar a URL gerada pela Vercel (ex: `https://docs-church.vercel.app`).
- [ ] **Resultado Esperado:** O navegador carrega automaticamente os scripts em `polyfills-legacy.js` e `index-legacy.js` através das tags `<script nomodule>`, abrindo a tela inicial sem travamento ou tela branca.

### ✅ B. Visão do Pastor (Zero-Scroll & Duas Folhas)
- [ ] No tablet, digitar `ADU-PNO` e selecionar **Púlpito (Pastor)**.
- [ ] Girar o tablet para o **modo paisagem**.
- [ ] **Resultado Esperado:** Exibição das duas folhas perfeitamente distribuídas lado a lado, sem barra de rolagem vertical.
- [ ] Tocar na borda direita da tela ou no botão `Folhas 3-4 ▶` para navegar entre os blocos.
- [ ] Testar o zoom de leitura (`A-` e `A+`) para conforto do pregador.

### ✅ C. Teste de Queda de Conexão Wi-Fi (Resiliência Offline)
- [ ] Com o púlpito aberto, desligar o roteador Wi-Fi ou desativar o Wi-Fi do tablet por 2 minutos.
- [ ] **Resultado Esperado:** A tela do pastor **não apaga nem fecha**; o indicador no rodapé passa suavemente para `Offline (Seguro)` e os textos continuam legíveis na tela através do snapshot em `localStorage`.
- [ ] Religar o Wi-Fi: o indicador volta para `Sincronizado` automaticamente via Smart-Polling.

### ✅ D. Cabine & Prévia do Púlpito (Live Tablet Peek)
- [ ] No smartphone ou notebook da transmissão, entrar com `ADU-PNO` como **Controlador** (PIN `1234`).
- [ ] Clicar no botão `Prévia do Púlpito` na barra superior.
- [ ] **Resultado Esperado:** Abre-se a réplica exata em tempo real do tablet do púlpito, permitindo que a cabine confirme a legibilidade e o aviso ativo antes de alertar o pregador.

### ✅ E. Persistência de 3 Horas & Free Tier
- [ ] Dar **Refresh (F5)** na página em qualquer aparelho: a tela do culto permanece aberta no primeiro milissegundo sem pedir login novamente.
- [ ] Fechar a aba do navegador (`tab close`) e abrir em nova guia: o sistema volta à tela inicial com segurança.
- [ ] Aba esquecida aberta por mais de 3 horas: o sistema encerra o polling automaticamente para economizar horas do Neon e manter a conta no plano gratuito.
