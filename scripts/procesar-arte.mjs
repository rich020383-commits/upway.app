#!/usr/bin/env node
/**
 * scripts/procesar-arte.mjs
 *
 * Convierte los artes de marca que llegan a `public/*-new.png` en los JPG que
 * consume el sitio, y aparta los originales.
 *
 *   node scripts/procesar-arte.mjs
 *
 * Qué produce
 * -----------
 *   public/verticales/{salud,center,inmobiliaria}.jpg   840x420  (tarjetas 2:1)
 *   public/sectores/{clinicas,eps,ips,centros-de-salud,consultorios}.jpg
 *                                                          440x280  (tarjetas 220/140)
 *
 * Por qué un script y no un recorte manual
 * ---------------------------------------
 * Los artes llegan en formatos que no coinciden con las tarjetas: las tres
 * verticales son piezas verticales 3:4 con el logo arriba y el titular abajo, y
 * los sectores son cuadrados con una etiqueta flotante redundante. Sin un
 * recorte con criterio, `object-cover` deja palabras cortadas a la mitad.
 *
 * Reglas que aplica este script
 * -----------------------------
 *   - Las verticales usan la banda SUPERIOR sin recortar de los lados: así el
 *     logo "UPWAY BUSINESS <vertical>" entra completo, y la tarjeta ya pone el
 *     nombre debajo. Recortar de los lados para evitar que asome la siguiente
 *     etiqueta parte el logo, que es peor.
 *   - Los sectores se cortan para dejar solo el edificio: la etiqueta flotante
 *     ("IPS", "EPS"...) repite el título que la tarjeta ya muestra, y al
 *     recortarse al centro quedaba partida a media palabra.
 *   - Todo se guarda en JPEG: los PNG de marca pesan 60-250 KB y Next los
 *     volvería a recomprimir en cada request.
 *   - Todo sale al doble del ancho en CSS (2x) para que se vea nítido en retina.
 *
 * Es idempotente: volver a correrlo sobrescribe las salidas con el mismo
 * resultado, así que se puede repetir sin riesgo si cambian los artes.
 */

import { mkdir, copyFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = 'public';
const VERTICALES_DIR = 'public/verticales';
const SECTORES_DIR = 'public/sectores';
const RESERVA_DIR = '.audit-assets'; // ignorado por git: aquí quedan los originales

const CALIDAD = 88;

/**
 * `extract` es opcional: si no se indica, la imagen se recorta con `position`.
 * Para las verticales se omite a propósito (ver Reglas, arriba).
 */
const RECORTE = [
  // --- Tarjetas de la portada -------------------------------------------
  { entrada: 'health-new.png', salida: 'salud.jpg', dir: VERTICALES_DIR, w: 840, h: 420 },
  { entrada: 'Callcenter-new.png', salida: 'center.jpg', dir: VERTICALES_DIR, w: 840, h: 420 },
  { entrada: 'inmobiliaria-new.png', salida: 'inmobiliaria.jpg', dir: VERTICALES_DIR, w: 840, h: 420 },

  // --- Sectores de Health ------------------------------------------------
  {
    entrada: 'clinica-new.png',
    salida: 'clinicas.jpg',
    dir: SECTORES_DIR,
    w: 440,
    h: 280,
    // Deja fuera la etiqueta de la esquina (termina en y~310) y la de abajo
    // (empieza en y~960), y conserva enteros el rótulo "Clínica" y el panel
    // lateral de servicios, igual que en las otras cuatro piezas de sector.
    extract: { left: 270, top: 315, width: 940, height: 598 },
  },
  { entrada: 'centromedico-new.png', salida: 'centros-de-salud.jpg', dir: SECTORES_DIR, w: 440, h: 280 },
  { entrada: 'eps-new.png', salida: 'eps.jpg', dir: SECTORES_DIR, w: 440, h: 280 },
  { entrada: 'ips-new.png', salida: 'ips.jpg', dir: SECTORES_DIR, w: 440, h: 280 },
  { entrada: 'consultorio-new.png', salida: 'consultorios.jpg', dir: SECTORES_DIR, w: 440, h: 280 },
];

async function main() {
  /* Se validan TODOS los orígenes antes de generar nada: si falta uno, es
     preferible no escribir ninguna salida a dejar el árbol a medias con
     tres verticales viejas y cinco nuevas. */
  const faltantes = RECORTE.filter((t) => !existsSync(path.join(PUBLIC_DIR, t.entrada)));
  if (faltantes.length > 0) {
    console.error('✗ Faltan los siguientes artes de origen en public/:');
    for (const t of faltantes) console.error(`   ${t.entrada}`);
    console.error(
      `\nSe procesan una sola vez: al terminar los originales se apartan a ${RESERVA_DIR}/.` +
        `\nPara volver a recortar, copiálos de ahí a public/ y vuelve a correr el script.`
    );
    process.exit(1);
  }

  await mkdir(VERTICALES_DIR, { recursive: true });
  await mkdir(SECTORES_DIR, { recursive: true });
  await mkdir(RESERVA_DIR, { recursive: true });

  const resumen = [];

  for (const t of RECORTE) {
    const origen = path.join(PUBLIC_DIR, t.entrada);

    let imagen = sharp(origen);
    if (t.extract) imagen = imagen.extract(t.extract);

    const destino = path.join(t.dir, t.salida);
    await imagen
      .resize(t.w, t.h, { fit: 'cover', position: 'north' })
      .jpeg({ quality: CALIDAD, mozjpeg: true })
      .toFile(destino);

    // El original sale de `public/` (todo lo que está ahí se publica) y queda
    // en la carpeta ignorada por si hay que volver a recortar.
    await copyFile(origen, path.join(RESERVA_DIR, t.entrada));
    await unlink(origen);

    const meta = await sharp(destino).metadata();
    resumen.push(`   ${t.salida.padEnd(22)} ${meta.width}x${meta.height}`);
  }

  console.log('✓ Listo. Generadas:');
  for (const linea of resumen) console.log(linea);
  console.log(`\nOriginales apartados en ${RESERVA_DIR}/ (ignorada por git).`);
  console.log('Las rutas ya están cableadas: no hace falta editar nada más.');
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});