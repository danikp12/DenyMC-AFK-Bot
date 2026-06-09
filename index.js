"use strict";

const mineflayer = require("mineflayer");
const express = require("express");

// ============================================================
// KONFIGURATION (Hier deine Daten eintragen)
// ============================================================
const config = {
  host: 'denymc.opzonen.net',
  port: 27817,
  username: 'DenyMC',     // <- ÄNDERN: Dein Wunschname für den Bot
  password: 'DenyMCAdminBot_08.06.2026',    // <- ÄNDERN: Dein Server-Passwort für /login
  version: '1.21.1'
};

// ============================================================
// EXPRESS SERVER (Hält Render.com aktiv)
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;

let botState = {
  connected: false,
  uptime: "0s",
  coords: "Warte auf Verbindung..."
};

let connectTime = Date.now();

// Einfaches Dashboard für Render.com
app.get('/', (req, res) => {
  const currentUptime = botState.connected ? Math.floor((Date.now() - connectTime) / 1000) + "s" : "0s";
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bot Dashboard</title>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; background: #0d1117; color: #e6edf3; text-align: center; padding: 50px; }
          .card { background: #161b22; border: 1px solid #21262d; padding: 20px; border-radius: 10px; display: inline-block; min-width: 300px; }
          .status { font-weight: bold; color: ${botState.connected ? '#3fb950' : '#f85149'}; }
        </style>
      </head>
      <body>
        <h1>Minecraft AFK Bot</h1>
        <div class="card">
          <p>Status: <span class="status">${botState.connected ? 'ONLINE' : 'OFFLINE'}</span></p>
          <p>Uptime: <span>${currentUptime}</span></p>
          <p>Position: <span>${botState.coords}</span></p>
          <p>Server: <span>${config.host}:${config.port}</span></p>
        </div>
        <p style="font-size:12px;color:#8b949e;margin-top:20px;">Seite lädt sich nicht automatisch neu. Bitte manuell aktualisieren.</p>
      </body>
    </html>
  `);
});

// Health-Check für Render
app.get('/health', (req, res) => {
  res.json({ status: botState.connected ? 'connected' : 'disconnected' });
});

app.listen(PORT, () => {
  console.log(`[Dashboard] Läuft auf Port ${PORT}`);
});

// ============================================================
// MINEFLAYER MINECRAFT BOT
// ============================================================
let bot;

function createBot() {
  console.log(`[Bot] Verbinde mit ${config.host}:${config.port}...`);
  
  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  });

  bot.once('spawn', () => {
    console.log(`[Bot] [+] Erfolgreich auf dem Server gespawnt!`);
    botState.connected = true;
    connectTime = Date.now();

    // Sende Login-Befehl nach 3 Sekunden
    setTimeout(() => {
      if (config.password) {
        console.log(`[Auth] Sende Login-Befehl...`);
        bot.chat(`/login ${config.password}`);
      }
    }, 3000);

    // Aktualisiere die Koordinaten im Dashboard jede Sekunde
    setInterval(() => {
      if (bot && bot.entity) {
        const p = bot.entity.position;
        botState.coords = `X: ${Math.floor(p.x)} | Y: ${Math.floor(p.y)} | Z: ${Math.floor(p.z)}`;
      }
    }, 1000);
  });

  bot.on('message', (jsonMsg) => {
    console.log(`[Chat] ${jsonMsg.toString()}`);
  });

  bot.on('error', (err) => {
    if (err.code === 'ECONNRESET') {
      console.log(`[Bot] Verbindung vom Server abrupt geschlossen (ECONNRESET).`);
    } else {
      console.log(`[Bot] Fehler:`, err.message);
    }
  });

  bot.on('end', (reason) => {
    console.log(`[Bot] Verbindung getrennt. Grund: ${reason}`);
    botState.connected = false;
    botState.coords = "Warte auf Verbindung...";
    
    const reconnectDelay = 15000; // 15 Sekunden warten vor Neustart
    console.log(`[Bot] Versuche Neustart in ${reconnectDelay / 1000} Sekunden...`);
    
    setTimeout(() => {
      createBot();
    }, reconnectDelay);
  });
}

// Bot starten
createBot();
