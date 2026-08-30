import { Client } from 'pg';

// Patrón para evitar conexiones duplicadas cuando guardas cambios en VS Code
let isListening = false;

export function iniciarOidoNeon() {
  if (isListening) return;

  const client = new Client({
    connectionString: process.env.DIRECT_URL, // La conexión limpia, sin el -pooler
  });

  client.connect((err: Error | null) => {
    if (err) {
      console.error('❌ Error conectando el Listener a Neon:', err.stack);
      scheduleReconnect();
      return;
    }
    console.log('👂 Servidor Upway conectado y escuchando eventos de Neon...');
  });

  // 🛡️ Si la conexión se cae (cierre de idle en Neon, red, etc.), intentamos reconectar
  client.on('error', (err: Error) => {
    console.error('❌ Error en la conexión del Listener a Neon:', err.message);
    scheduleReconnect();
  });

  // Reintento con backoff simple, sin bloquear el proceso
  let reconnectAttempts = 0;
  function scheduleReconnect() {
    if (!isListening) return; // Ya hay un reintento en marcha
    isListening = false;
    reconnectAttempts = Math.min(reconnectAttempts + 1, 6);
    const delayMs = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 60000);
    console.log(`🔁 Reintentando conexión del Listener en ${delayMs / 1000}s...`);
    setTimeout(() => {
      try {
        iniciarOidoNeon();
      } catch (e) {
        console.error('❌ Error reintentando conexión del Listener:', e);
      }
    }, delayMs);
  }

  // Le decimos a Postgres qué canal escuchar (el mismo que creaste en el SQL)
  client.query('LISTEN alerta_upway');

  // Cada vez que Postgres grite, este bloque se ejecuta instantáneamente
  client.on('notification', (msg) => {
    if (msg.payload) {
      let nuevoLead: unknown;
      try {
        nuevoLead = JSON.parse(msg.payload);
      } catch (parseError) {
        console.error('⚠️ Payload de notificación no es JSON válido, se ignora:', parseError);
        return;
      }
      console.log('🚨 [UPWAY EVENTO] ¡Nuevo registro guardado en tiempo real!');
      console.log('📦 Datos:', nuevoLead);

      // ==========================================
      // 🧠 AQUÍ DISPARAS LA LÓGICA DE WHATSAPP O VAPI
      // ==========================================
    }
  });

  isListening = true;
}