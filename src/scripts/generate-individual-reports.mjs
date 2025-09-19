import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MAPPINGS_PATH } from './config.js';
import { loadJson } from './utils.js';
import { parseCsvFile, performIndividualAnalysis } from './services/csv-processor.js';
import { OPEN_ENDED_QUESTIONS } from './config.js';

function getArg(key, def = null) {
  const v = process.argv.find(a => a.startsWith(key + '='));
  return v ? v.split('=')[1] : def;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function normalize(str) {
  if (!str) return '';
  try {
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  } catch {
    return String(str).trim();
  }
}

function anonymizeText(t) {
  let s = String(t);
  s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]');
  s = s.replace(/\b(?:\+?\d[\d\s().-]{6,}\d)\b/g, '[TEL]');
  s = s.replace(/@[a-z0-9_\-.]+/gi, '[USER]');
  return s;
}

function cleanOpenEndedFromRow(row) {
  const out = {};
  for (const key of Object.keys(OPEN_ENDED_QUESTIONS)) {
    const col = OPEN_ENDED_QUESTIONS[key];
    const v = row[col];
    if (v && String(v).trim()) {
      const norm = normalize(v).replace(/\s+/g, ' ');
      out[key] = [anonymizeText(norm)];
    }
  }
  return out;
}

function hashId(email, nameFallback) {
  const base = (email && String(email).toLowerCase().trim()) || String(nameFallback || '').toLowerCase().trim();
  return crypto.createHash('sha1').update(base).digest('hex').slice(0, 16);
}

async function main() {
  try {
    const csvPath = getArg('--csv', path.join(process.cwd(), 'data', 'respuestas-por-puntos.csv'));
    const empresa = getArg('--empresa', 'Empresa');
    const outDir = getArg('--outDir', path.join(process.cwd(), 'src', 'data', 'individual'));
    const limit = parseInt(getArg('--limit', ''), 10);

    if (!fs.existsSync(csvPath)) throw new Error(`CSV no encontrado: ${csvPath}`);

    console.log(`Leyendo CSV: ${csvPath}`);
    const rows = parseCsvFile(csvPath);
    console.log(`Filas leídas: ${rows.length}`);

    const mappings = loadJson(MAPPINGS_PATH);

    const ID_COL = '#';
    const NAME_COL = 'DEMO_CONTACT: Nombre';
    const LAST_COL = 'DEMO_CONTACT: Apellido';
    const EMAIL_COL = 'DEMO_CONTACT: Email';

    ensureDir(outDir);

    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      if (!isNaN(limit) && count >= limit) break;
      const row = rows[i];
      const csvId = (row[ID_COL] || '').toString().trim();
      const nombre = (row[NAME_COL] || '').toString().trim();
      const apellido = (row[LAST_COL] || '').toString().trim();
      const email = (row[EMAIL_COL] || '').toString().trim();

      if (!nombre && !apellido && !email) continue;

      const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      const id = csvId || hashId(email, nombreCompleto || `row-${i}`);

      // Análisis cuantitativo individual
      const scores = performIndividualAnalysis(row, mappings);

      // Abiertas del individuo (limpias/anonimizadas)
      const openEnded = cleanOpenEndedFromRow(row);

      const doc = {
        header: {
          empresa,
          generatedAt: new Date().toISOString(),
          schema: 'individual-1.0',
          id,
          subject: { nombreCompleto, email },
        },
        scores,
        openEnded,
      };

      const outPath = path.join(outDir, `${id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf8');
      count++;
    }

    console.log(`✅ Reportes individuales generados en ${outDir}. Total: ${count}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
