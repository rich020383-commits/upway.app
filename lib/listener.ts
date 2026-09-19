import { Client, type ClientConfig } from 'pg';
import { resolveDatabaseUrl } from '@/lib/database-url';

// Patrón para evitar conexiones duplicadas cuando guardas cambios en VS Code
let isListening = false;

/**
 * Configuración de la conexión LISTEN contra Aiven.
 *
 * Aiven publica su propia CA, así que `sslmode=require` necesita la semántica de
 * libpq para que node-postgres no rechace la cadena (error típico:
 * "self-signed certificate in certificate chain").
 *
 * Si el operador quiere verificación estricta, basta definir DATABASE_CA_CERT
 * con la CA que Aiven entrega en el panel: en ese caso se valida el certificado
 * y no se relaja nada.
 */
function buildClientConfig(connectionString: string): ClientConfig {
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n');
  if (ca) {
    return { connectionString, ssl: { ca, rejectUnauthorized: true } };
  }
  if (connectionString.includes('uselibpqcompat=')) {
    return { connectionString };
  }
  const separator = connectionString.includes('?') ? '&' : '?';
  return { connectionString: `${connectionString}${separator}uselibpqcompat=true` };
}

export function iniciarOidoBaseDatos() {
  if (typeof window !== 'undefined') return;
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    return;
  }
  if (isListening) return;

  isListening = true;

  const client = new Client(buildClientConfig(connectionString));

  client.connect((err: Error | null) => {
    if (err) {
      console.error('❌ Error conectando el Listener a la base de datos:', err.stack);
      scheduleReconnect();
      return;
    }

    client.query('LISTEN alerta_upway');
    console.log('👂 Servidor Upway conectado y escuchando eventos de la base de datos...');
  });

  client.on('error', (err: Error) => {
    console.error('❌ Error en la conexión del Listener a la base de datos:', err.message);
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
        iniciarOidoBaseDatos();
      } catch (e) {
        console.error('❌ Error reintentando conexión del Listener:', e);
      }
    }, delayMs);
  }
}