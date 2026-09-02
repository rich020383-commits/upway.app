import { Client } from 'pg';

// Patrón para evitar conexiones duplicadas cuando guardas cambios en VS Code
let isListening = false;

export function iniciarOidoNeon() {
  if (typeof window !== 'undefined') return;
  if (!process.env.DIRECT_URL) {
    return;
  }
  if (isListening) return;

  isListening = true;

  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  client.connect((err: Error | null) => {
    if (err) {
      console.error('❌ Error conectando el Listener a Neon:', err.stack);
      scheduleReconnect();
      return;
    }

    client.query('LISTEN alerta_upway');
    console.log('👂 Servidor Upway conectado y escuchando eventos de Neon...');
  });

  client.on('error', (err: Error) => {
    console.error('❌ Error en la conexión del Listener a Neon:', err.message);
    scheduleReconnect();
  });

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
    }
  });

  let reconnectAttempts = 0;
  function scheduleReconnect() {
    if (!isListening) return;
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
}