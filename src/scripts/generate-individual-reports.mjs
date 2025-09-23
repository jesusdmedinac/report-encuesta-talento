import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MAPPINGS_PATH, TARGETS_10 } from './config.js';
import { loadJson } from './utils.js';
import { parseCsvFile, performIndividualAnalysis } from './services/csv-processor.js';
import { OPEN_ENDED_QUESTIONS } from './config.js';
import { assignLevel } from './services/baremos.js';
import { selectIndividualActionPlan, loadActionCatalog, maybeRewriteActionPlan } from './services/action-plan.js';
import { validateData } from './services/validator.js';

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
    const withActions = getArg('--no-actions', null) === null; // por defecto true, --no-actions para desactivar
    const useAI = !!getArg('--ai', null); // re-redacción opcional
    const provider = getArg('--provider', process.env.PROVIDER || '');
    const model = getArg('--model', process.env.MODEL || '');
    const defaultAsp = getArg('--aspiracion', '');
    // Límite por defecto a 1 para evitar generar toda la base accidentalmente
    const limit = parseInt(getArg('--limit', '1'), 10);
    const idsArg = getArg('--ids', '');
    const idsSet = idsArg ? new Set(idsArg.split(',').map(s => String(s).trim()).filter(Boolean)) : null;

    if (!fs.existsSync(csvPath)) throw new Error(`CSV no encontrado: ${csvPath}`);

    console.log(`Leyendo CSV: ${csvPath}`);
    const rows = parseCsvFile(csvPath);
    console.log(`Filas leídas: ${rows.length}`);
    if (!isNaN(limit)) {
      console.log(`Límite de generación activo: ${limit} (ajusta con --limit o usa --ids)`);
    }

    const mappings = loadJson(MAPPINGS_PATH);

    const ID_COL = '#';
    const NAME_COL = 'DEMO_CONTACT: Nombre';
    const LAST_COL = 'DEMO_CONTACT: Apellido';
    const EMAIL_COL = 'DEMO_CONTACT: Email';
    const DEMO_AREA = 'DEMO_PROFESSIONAL: Departamento:';
    const DEMO_EDU = 'DEMO_PROFESSIONAL: Nivel de estudios:';
    const DEMO_ROL = 'DEMO_PROFESSIONAL: Menciona el rol que cumples en tu empresa:';
    const DEMO_GENERO = 'DEMO_PROFESSIONAL: Género:';
    const DEMO_EDAD = 'DEMO_PROFESSIONAL: Rango de Edad:';
    const DEMO_ASP = 'DEMO_PROFESSIONAL: ¿Hacia qué posición, área o tipo de rol aspiras llegar en tu desarrollo profesional?';

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

    function percentileRankInc(values, x) {
      const arr = (values || []).filter(v => Number.isFinite(v));
      const n = arr.length;
      if (!n) return 0;
      let below = 0, equal = 0;
      for (const v of arr) {
        if (v < x) below++; else if (v === x) equal++;
      }
      const pr = ((below + 0.5 * equal) / n) * 100;
      return Math.round(pr);
    }

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

      if (idsSet && !idsSet.has(id)) {
        continue;
      }

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
        const pr = percentileRankInc(collectByDim[d], current10);
        summary.dimensions[d] = {
          current10,
          target10,
          gap10,
          collectiveAverage10: collective10,
          percentile: pr,
          level_label: assignLevel(d, current10) || null,
        };
      }

      // Abiertas del individuo (limpias/anonimizadas)
      const openEnded = cleanOpenEndedFromRow(row);

      // Plan de acción: determinista con catálogo y señales
      const actionCatalog = withActions ? loadActionCatalog() : null;

      const nowIso = new Date().toISOString();
      // Demográficos
      const demographics = {};
      if (row[DEMO_ROL]) demographics.rol = String(row[DEMO_ROL]).trim();
      if (row[DEMO_AREA]) demographics.area = String(row[DEMO_AREA]).trim();
      if (row[DEMO_EDU]) demographics.nivelEducativo = String(row[DEMO_EDU]).trim();
      if (row[DEMO_GENERO]) demographics.genero = String(row[DEMO_GENERO]).trim();
      if (row[DEMO_EDAD]) demographics.rangoEdad = String(row[DEMO_EDAD]).trim();
      const aspiracionProfesional = String(row[DEMO_ASP] || defaultAsp || '').trim();

      let doc = {
        schema_version: '1.0',
        generated_at: nowIso,
        provenance: { source: path.basename(csvPath), generator: 'generate-individual-reports.mjs' },
        header: {
          empresa,
          generatedAt: nowIso,
          schema: 'individual-1.0',
          id,
          subject: { nombreCompleto, email, assessed_on: nowIso, ...(Object.keys(demographics).length ? { demographics } : {}) },
        },
        scores,   // 1–4 por subdimensión (trazabilidad)
        scores10, // 1–10 por subdimensión (para visualización/contrato)
        summary,  // por dimensión
        openEnded,
        action_plan: withActions ? selectIndividualActionPlan({ header: { subject: { demographics } }, summary, openEnded, scores10 }, actionCatalog, { maxIniciativas: 4, aspiracionProfesional }) : undefined,
     };

      // Re-redacción opcional con IA (sin cambiar estructura)
      if (useAI && withActions && doc.action_plan) {
        doc = { ...doc, action_plan: await maybeRewriteActionPlan(doc.action_plan, doc, { provider, model }) };
      }

      // Validar contra el esquema individual antes de escribir
      try {
        validateData(doc, 'individual');
      } catch (ve) {
        console.error(`\n❌ Documento individual inválido (id=${id}): ${ve.message}`);
        continue;
      }

      const outPath = path.join(outDir, `${id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf8');
      count++;
    }

    if (idsSet) {
      console.log(`Filtro --ids activo (${idsSet.size} id(s)).`);
    }
    console.log(`✅ Reportes individuales generados en ${outDir}. Total: ${count}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
