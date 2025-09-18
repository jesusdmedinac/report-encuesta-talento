import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { getArgument } from './utils.js';
import { loadAndProcessCsv } from './services/csv-processor.js';
import { initializeAiClient, preAnalyzeOpenEnded } from './services/ai-analyzer.js';

function buildFallbackOpenEnded(openEndedData) {
  const STOP = new Set(['para','sobre','con','como','que','del','los','las','una','uno','esta','este','ser','mas','más','mejor','herramientas','empresa','por','del','de','la','el','y','o','u','al','en','se','su','sus','es','son','muy','tan','hay','lo','las','los']);
  const out = { preguntas: {}, resumenGeneral: '', metricaSentimiento: 'neutral' };
  for (const [code, responses] of Object.entries(openEndedData)) {
    if (!Array.isArray(responses) || responses.length === 0) continue;
    const counts = new Map();
    const idxByToken = new Map();
    responses.forEach((r, idx) => {
      String(r).toLowerCase().split(/[^a-záéíóúñü0-9]+/i).forEach(tok => {
        const t = tok.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        if (!t || t.length < 5) return;
        if (STOP.has(t)) return;
        counts.set(t, (counts.get(t) || 0) + 1);
        if (!idxByToken.has(t)) idxByToken.set(t, []);
        const arr = idxByToken.get(t);
        if (arr.length < 5) arr.push(idx);
      });
    });
    const top = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const temas = top.map(([tok, cnt], i) => ({
      id: `T-${i+1}`,
      etiqueta: tok,
      palabrasClave: [tok],
      conteo: cnt,
      sentimiento: 'neutral',
      citas: (idxByToken.get(tok) || []).slice(0,3).map(ix => String(responses[ix]))
    }));
    out.preguntas[code] = {
      temas,
      resumenGeneral: temas.length ? `Temas recurrentes: ${temas.slice(0,5).map(t=>t.etiqueta).join(', ')}.` : 'Sin temas destacados (modo offline).',
      metricaSentimiento: 'neutral'
    };
  }
  try {
    const labels = Object.values(out.preguntas).flatMap(q => (q.temas||[]).map(t=>t.etiqueta));
    out.resumenGeneral = labels.length ? `Temas recurrentes: ${Array.from(new Set(labels)).slice(0,8).join(', ')}.` : '';
  } catch {}
  return out;
}

async function main() {
  try {
    const csvFilePath = getArgument('--csv');
    const reportId = getArgument('--reportId');
    const provider = getArgument('--provider') || 'gemini';
    const modelName = getArgument('--model');
    const force = process.argv.includes('--force');

    if (!csvFilePath || !reportId) {
      throw new Error('Faltan argumentos obligatorios. Requiere --csv y --reportId.');
    }

    const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', `openEnded.${reportId}.json`);

    // Calcular hash del CSV para saber si cambia el origen
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const csvHash = crypto.createHash('sha256').update(csvContent).digest('hex');

    if (!force && fs.existsSync(OUTPUT_PATH)) {
      try {
        const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
        if (existing?.source?.csvHash === csvHash) {
          console.log(`Caché existente válido encontrado en ${OUTPUT_PATH}. Usa --force para regenerar.`);
          process.exit(0);
        }
      } catch {}
    }

    // Inicializar IA
    const { aiClient, effectiveModelName } = initializeAiClient(provider, modelName);

    // Cargar y limpiar abiertas
    const { openEndedData, quantitativeData } = loadAndProcessCsv(csvFilePath);
    const rowCount = quantitativeData.length;

    if (!Object.values(openEndedData).some(arr => Array.isArray(arr) && arr.length)) {
      console.log('No se encontraron respuestas abiertas significativas. Se creará un archivo vacío de caché.');
      const cache = { source: { csvPath: csvFilePath, csvHash, rowCount, generatedAt: new Date().toISOString() }, preguntas: {}, resumenGeneral: '' };
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2), 'utf8');
      console.log(`✅ Caché generado en: ${OUTPUT_PATH}`);
      process.exit(0);
    }

    // Pre‑análisis por lotes (con fallback offline)
    console.log('Realizando pre‑análisis de preguntas abiertas...');
    let analysis;
    try {
      analysis = await preAnalyzeOpenEnded(provider, aiClient, effectiveModelName, openEndedData);
    } catch (e) {
      console.warn('Fallo IA en pre‑análisis. Generando caché en modo offline:', e.message);
      analysis = buildFallbackOpenEnded(openEndedData);
    }

    const cache = {
      source: { csvPath: csvFilePath, csvHash, rowCount, generatedAt: new Date().toISOString() },
      ...analysis,
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`✅ Caché generado en: ${OUTPUT_PATH}`);
  } catch (e) {
    console.error(`❌ Error al generar caché de abiertas: ${e.message}`);
    process.exit(1);
  }
}

main();
