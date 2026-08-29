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
      return;
    }
    console.log('👂 Servidor Upway conectado y escuchando eventos de Neon...');
  });

  // Le decimos a Postgres qué canal escuchar (el mismo que creaste en el SQL)
  client.query('LISTEN alerta_upway');

  // Cada vez que Postgres grite, este bloque se ejecuta instantáneamente
  client.on('notification', (msg) => {
    if (msg.payload) {
      const nuevoLead = JSON.parse(msg.payload);
      console.log('🚨 [UPWAY EVENTO] ¡Nuevo registro guardado en tiempo real!');
      console.log('📦 Datos:', nuevoLead);
      
      // ==========================================
      // 🧠 AQUÍ DISPARAS LA LÓGICA DE WHATSAPP O VAPI
      // ==========================================
    }
  });

  isListening = true;
}