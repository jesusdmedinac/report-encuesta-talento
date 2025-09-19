import fs from 'fs';
import path from 'path';
import { parseCsvFile } from './services/csv-processor.js';

function getArgument(key) {
  const arg = process.argv.find(a => a.startsWith(key + '='));
  return arg ? arg.split('=')[1] : null;
}

function normalize(str) {
  if (!str) return '';
  try {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  } catch {
    return String(str).toLowerCase().trim();
  }
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  try {
    const csvPath = getArgument('--csv') || path.join(process.cwd(), 'data', 'respuestas-por-puntos.csv');
    const outPath = getArgument('--out') || path.join(process.cwd(), 'public', 'respuestas-index.json');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV no encontrado: ${csvPath}`);
    }

    console.log(`Leyendo CSV: ${csvPath}`);
    const rows = parseCsvFile(csvPath);
    console.log(`Filas leídas: ${rows.length}`);

    const NAME_COL = 'DEMO_CONTACT: Nombre';
    const LAST_COL = 'DEMO_CONTACT: Apellido';
    const EMAIL_COL = 'DEMO_CONTACT: Email';

    const seenEmails = new Set();
    const index = [];

    for (const row of rows) {
      const nombre = (row[NAME_COL] || '').toString().trim();
      const apellido = (row[LAST_COL] || '').toString().trim();
      const email = (row[EMAIL_COL] || '').toString().trim();

      if (!nombre && !apellido && !email) continue; // vacío

      const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      const emailL = normalize(email);
      // Deduplicar por email cuando esté presente
      const dedupeKey = emailL || `${normalize(nombreCompleto)}#${index.length}`;
      if (seenEmails.has(dedupeKey)) continue;
      seenEmails.add(dedupeKey);

      index.push({
        nombreCompleto,
        email,
        nombreL: normalize(nombreCompleto),
        emailL,
      });
    }

    ensureDir(outPath);
    fs.writeFileSync(outPath, JSON.stringify(index, null, 2), 'utf8');
    console.log(`✅ Índice generado: ${outPath}`);
    console.log(`Registros en índice: ${index.length}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();

