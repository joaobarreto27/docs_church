#!/usr/bin/env node
/**
 * Real UI Mockup Runner
 * Captura telas e mockups 100% fiéis de pixels reais da aplicação usando
 * Google Chrome Headless nativo via Chrome DevTools Protocol (CDP).
 * Zero dependências externas (usa recursos nativos do Node 18+).
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Presets de visualização
const VIEWPORT_PRESETS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, // iPhone 14/15/16
  'mobile-android': { width: 360, height: 800, deviceScaleFactor: 2, mobile: true }, // Samsung Galaxy
  tablet: { width: 1280, height: 800, deviceScaleFactor: 1.5, mobile: false }, // Samsung Tab A9 / iPad (Paisagem)
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, // MacBook Air / Pro
  'desktop-hd': { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false } // Monitor Full HD
};

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function checkPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: '/' }, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

class CDPSession {
  constructor(wsUrl) {
    this.ws = new globalThis.WebSocket(wsUrl);
    this.msgId = 1;
    this.pending = new Map();
  }

  async init() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message || 'CDP Error'));
          else resolve(data.result);
        }
      } catch (err) {
        console.error('Erro ao processar mensagem CDP:', err);
      }
    };

    await this.send('Runtime.enable');
    await this.send('Page.enable');
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async setViewport(presetOrCustom) {
    const config = typeof presetOrCustom === 'string'
      ? (VIEWPORT_PRESETS[presetOrCustom] || VIEWPORT_PRESETS.desktop)
      : presetOrCustom;
    await this.send('Emulation.setDeviceMetricsOverride', config);
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await this.wait(1200);
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return result.result?.value;
  }

  async captureScreenshot(outputPath, options = {}) {
    const captureParams = { format: options.format || 'png' };
    if (options.quality) captureParams.quality = options.quality;
    if (options.clip) captureParams.clip = options.clip;

    const res = await this.send('Page.captureScreenshot', captureParams);
    const buffer = Buffer.from(res.data, 'base64');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function runMockup(options = {}) {
  const {
    cwd = process.cwd(),
    url = 'http://localhost:3000',
    port = 3000,
    scenes = [],
    autoStartServer = true
  } = options;

  let viteProcess = null;
  let chromeProcess = null;
  let cdp = null;

  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('Google Chrome não foi encontrado no sistema.');
  }

  const debugPort = 9222 + Math.floor(Math.random() * 50);
  const tempProfileDir = path.join('/tmp', `chrome-mockup-${Date.now()}`);

  try {
    // 1. Verifica servidor local
    const isRunning = await checkPortOpen(port);
    if (!isRunning && autoStartServer) {
      console.log(`[Mockup] Servidor local não detectado em :${port}. Iniciando temporariamente...`);
      viteProcess = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
        cwd,
        stdio: 'ignore'
      });
      await new Promise(r => setTimeout(r, 2500));
    }

    // 2. Inicia Chrome Headless
    console.log(`[Mockup] Iniciando Chrome Headless na porta CDP ${debugPort}...`);
    chromeProcess = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempProfileDir}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ], { stdio: 'ignore' });

    await new Promise(r => setTimeout(r, 2000));

    // 3. Obtém endpoint CDP
    const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const pageData = await listRes.json();
    cdp = new CDPSession(pageData.webSocketDebuggerUrl);
    await cdp.init();

    console.log(`[Mockup] Sessão CDP ativa! Executando ${scenes.length} cena(s)...`);

    const results = [];
    for (const [idx, scene] of scenes.entries()) {
      console.log(`[Mockup] Executando cena ${idx + 1}/${scenes.length}: ${scene.name || 'Sem nome'}`);
      
      if (scene.viewport) {
        await cdp.setViewport(scene.viewport);
      }
      
      if (scene.url) {
        await cdp.navigate(scene.url);
      }

      if (scene.script) {
        await cdp.evaluate(scene.script);
      }

      if (scene.waitMs) {
        await cdp.wait(scene.waitMs);
      } else {
        await cdp.wait(500);
      }

      if (scene.output) {
        const savedPath = await cdp.captureScreenshot(scene.output, scene.screenshotOptions);
        console.log(`  ✓ Capturado: ${savedPath}`);
        results.push({ name: scene.name, path: savedPath });
      }
    }

    return results;
  } finally {
    if (cdp) cdp.close();
    if (chromeProcess) {
      try { chromeProcess.kill('SIGTERM'); } catch (_) {}
    }
    if (viteProcess) {
      try { viteProcess.kill('SIGTERM'); } catch (_) {}
    }
    // Remove pasta temporária de perfil do chrome
    if (fs.existsSync(tempProfileDir)) {
      try { fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

// Execução via linha de comando se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const configArg = args.find(a => a.startsWith('--config='));
  
  if (configArg) {
    const configPath = path.resolve(process.cwd(), configArg.split('=')[1]);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    runMockup(config)
      .then(res => {
        console.log(`[Mockup] Concluído! ${res.length} imagem(ns) gerada(s).`);
        process.exit(0);
      })
      .catch(err => {
        console.error('[Mockup Error]', err);
        process.exit(1);
      });
  } else {
    // Exemplo rápido padrão
    console.log('Uso: node mockup-runner.js --config=caminho/para/config.json');
  }
}

module.exports = { runMockup, CDPSession, VIEWPORT_PRESETS };
