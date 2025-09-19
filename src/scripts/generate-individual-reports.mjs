import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MAPPINGS_PATH, TARGETS_10 } from './config.js';
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

    // Pre-cálculo: promedios colectivos por dimensión (cohorte completa) en 1–10
    const dims = ['madurezDigital','brechaDigital','usoInteligenciaArtificial','culturaOrganizacional'];
    const collectByDim = Object.fromEntries(dims.map(d => [d, []]));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ind = performIndividualAnalysis(r, mappings); // 1–4 por subdimensión
      for (const d of dims) {
        const subs = ind[d] || {};
        const vals = Object.values(subs).filter(v => typeof v === 'number' && v > 0);
        if (vals.length) {
          const avg = vals.reduce((a,b)=>a+b,0)/vals.length; // 1–4
          collectByDim[d].push(avg * 2.5); // a 1–10
        }
      }
    }
    const collectiveAvg10 = Object.fromEntries(dims.map(d => {
      const arr = collectByDim[d];
      const v = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
      return [d, +v.toFixed(2)];
    }));

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

      // Análisis cuantitativo individual (1–4 por subdimensión)
      const scores = performIndividualAnalysis(row, mappings);
      // Normalizados a 1–10 por subdimensión
      const scores10 = {};
      for (const dim of Object.keys(scores)) {
        scores10[dim] = {};
        for (const sub of Object.keys(scores[dim])) {
          const v = Number(scores[dim][sub]) || 0;
          scores10[dim][sub] = +(v * 2.5).toFixed(1);
        }
      }

      // Resumen por dimensión (current10/target10/gap10/collectiveAverage10)
      const summary = { dimensions: {} };
      for (const d of dims) {
        const subs = scores[d] || {};
        const vals = Object.values(subs).filter(v => typeof v === 'number' && v > 0);
        const rawAvg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0; // 1–4
        const current10 = +(rawAvg * 2.5).toFixed(1);
        const target10 = Number(TARGETS_10[d] ?? 8.0);
        const gap10 = +(target10 - current10).toFixed(1);
        const collective10 = Number(collectiveAvg10[d] || 0);
        summary.dimensions[d] = {
          current10,
          target10,
          gap10,
          collectiveAverage10: collective10,
        };
      }

      // Abiertas del individuo (limpias/anonimizadas)
      const openEnded = cleanOpenEndedFromRow(row);

      const nowIso = new Date().toISOString();
      const doc = {
        schema_version: '1.0',
        generated_at: nowIso,
        provenance: { source: path.basename(csvPath), generator: 'generate-individual-reports.mjs' },
        header: {
          empresa,
          generatedAt: nowIso,
          schema: 'individual-1.0',
          id,
          subject: { nombreCompleto, email, assessed_on: nowIso },
        },
        scores,   // 1–4 por subdimensión (trazabilidad)
        scores10, // 1–10 por subdimensión (para visualización/contrato)
        summary,  // por dimensión
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
