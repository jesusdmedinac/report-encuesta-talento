import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { getArgument } from './utils.js';
import { loadAndProcessCsv } from './services/csv-processor.js';
import { initializeAiClient, preAnalyzeOpenEnded } from './services/ai-analyzer.js';

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

    // Pre‑análisis por lotes
    console.log('Realizando pre‑análisis de preguntas abiertas...');
    const analysis = await preAnalyzeOpenEnded(provider, aiClient, effectiveModelName, openEndedData);

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

