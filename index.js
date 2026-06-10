const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. WEB SERVER FÜR RENDER.COM ---
// Sorgt dafür, dass Ihre App auf Render.com 24/7 online bleibt
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('MineKeep AFK-Bot läuft stabil im Hintergrund!');
});

app.listen(PORT, () => {
    console.log(`[Dashboard] Webserver läuft erfolgreich auf Port ${PORT}`);
});

// --- 2. KONFIGURATION (Hier Ihre MineKeep-Daten eintragen!) ---
const MINECRAFT_SERVER = 'denymc.minekeep.gg'; // <-- HIER bearbeiten: Ihre genaue MineKeep-Adresse eintragen
const MINECRAFT_PORT = 25565;                      // Der Standardport für MineKeep (So lassen!)
const BOT_USERNAME = 'DenyMC';                     // Der gewünschte Name des Bots im Spiel

// --- 3. BOT LOGIK (Direkte und stabile Verbindung) ---
function startBot() {
    console.log(`[Bot] Verbinde direkt mit ${MINECRAFT_SERVER}...`);

    const bot = mineflayer.createBot({
        host: MINECRAFT_SERVER,
        port: MINECRAFT_PORT,
        username: BOT_USERNAME,
        version: false // Erkennt die Minecraft-Version von MineKeep automatisch
    });

    // Event: Erfolgreich auf dem Server eingeloggt
    bot.on('login', () => {
        console.log(`[Bot] Erfolgreich auf MineKeep eingeloggt als ${bot.username}!`);
    });

    // Event: Bot spawnt in der Welt & springt gegen den AFK-Kick
    bot.on('spawn', () => {
        console.log('[Bot] Im Spiel gespawnt. Anti-AFK aktiv.');
        setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            }
        }, 45000); // Springt alle 45 Sekunden kurz hoch
    });

    // Event: Verbindung verloren (Automatischer Reconnect)
    bot.on('end', (reason) => {
        console.log(`[Bot] Verbindung getrennt. Grund: ${reason}`);
        console.log('[Bot] Starte automatischen Reconnect in 15 Sekunden...');
        setTimeout(startBot, 15000);
    });

    // Event: Fehler abfangen, damit die App nicht abstürzt
    bot.on('error', (err) => {
        console.log('[Bot-Fehler]', err.message);
    });
}

// Bot starten
startBot();
