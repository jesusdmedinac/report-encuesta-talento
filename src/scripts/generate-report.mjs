import fs from 'fs';
import path from 'path';

// Importaciones desde los nuevos módulos de refactorización
import { MAPPINGS_PATH } from './config.js';
import { getArgument, loadJson } from './utils.js';
import { loadAndProcessCsv, performQuantitativeAnalysis } from './services/csv-processor.js';
import { loadQuantitativeFromAnalysis } from './services/analysis-loader.js';
import { initializeAiClient, performQualitativeAnalysis, preAnalyzeOpenEnded } from './services/ai-analyzer.js';
import { generateReportJson } from './services/report-builder.js';
import { validateData } from './services/validator.js';

/**
 * Punto de entrada principal del script.
 * Orquesta la generación del reporte de madurez digital.
 */
async function main() {
    console.log('Iniciando la generación del reporte...');

    try {
        // 1. Parsear Argumentos de Línea de Comandos
        const provider = getArgument('--provider') || 'gemini';
        const modelName = getArgument('--model');
        const csvFilePath = getArgument('--csv');
        const empresaNombre = getArgument('--empresa');
        const reportId = getArgument('--reportId');
        const skipOpenEnded = process.argv.includes('--skip-open-ended');
        const refreshOpenEnded = process.argv.includes('--refresh-open-ended');
        const offline = process.argv.includes('--offline');

        if (!empresaNombre || !reportId) {
            throw new Error('Faltan argumentos obligatorios. Se requiere --empresa y --reportId.');
        }

        // 2. Inicializar Cliente de IA (omitido en modo offline)
        let aiClient = null;
        let effectiveModelName = modelName;
        if (!offline) {
            const init = initializeAiClient(provider, modelName);
            aiClient = init.aiClient;
            effectiveModelName = init.effectiveModelName;
            if (process.env.DEBUG_AI === '1' || process.env.DEBUG_AI === 'true') {
                console.log('DEBUG_AI activado: se guardarán respuestas crudas de IA en ./debug');
            }
        } else {
            effectiveModelName = modelName || 'offline';
            console.log('Modo OFFLINE: se omiten llamadas a IA.');
        }

        // 3. Cargar y Procesar Datos
        console.log(`Cargando mapeos desde: ${MAPPINGS_PATH}`);
        const mappings = loadJson(MAPPINGS_PATH);

        let quantitativeResults;
        let totalRespondents = 0;
        let openEndedData = {};
        const openEndedCachePath = path.join(process.cwd(), 'src', 'data', `openEnded.${reportId}.json`);
        let openEndedAnalysis = null;

        if (csvFilePath) {
            console.log(`Cargando y procesando datos desde: ${csvFilePath}`);
            const { quantitativeData, openEndedData: openEndedFromCsv } = loadAndProcessCsv(csvFilePath);
            totalRespondents = quantitativeData.length;
            openEndedData = openEndedFromCsv;

            console.log('Realizando análisis cuantitativo...');
            quantitativeResults = performQuantitativeAnalysis(quantitativeData, mappings);

            if (!skipOpenEnded) {
                if (!refreshOpenEnded && fs.existsSync(openEndedCachePath)) {
                    try {
                        openEndedAnalysis = JSON.parse(fs.readFileSync(openEndedCachePath, 'utf8'));
                        console.log(`Cargando caché de abiertas desde ${openEndedCachePath}`);
                    } catch (e) {
                        console.warn('No se pudo leer el caché de abiertas. Se intentará regenerar.', e.message);
                    }
                }
                if (!offline && !openEndedAnalysis && Object.values(openEndedData).some(arr => Array.isArray(arr) && arr.length)) {
                    console.log('Generando pre‑análisis de abiertas (sin script externo)...');
                    openEndedAnalysis = await preAnalyzeOpenEnded(provider, aiClient, effectiveModelName, openEndedData);
                    try {
                        fs.writeFileSync(openEndedCachePath, JSON.stringify({
                            source: { csvPath: csvFilePath, rowCount: quantitativeData.length, generatedAt: new Date().toISOString() },
                            ...openEndedAnalysis,
                        }, null, 2), 'utf8');
                        console.log(`Caché de abiertas guardado en ${openEndedCachePath}`);
                    } catch {}
                }
            } else {
                console.log('Flag --skip-open-ended activo: se omite el pre‑análisis de abiertas.');
            }
        } else {
            console.log('No se proporcionó --csv. Cargando métricas desde analysisScores.json.');
            const fallback = loadQuantitativeFromAnalysis();
            quantitativeResults = fallback.analysisResults;
            totalRespondents = fallback.sampleSize || 0;
            console.log(`Se utilizaron puntajes preprocesados derivados de ${fallback.source}`);
        }

        console.log('Realizando análisis cualitativo...');
        let qualitativeResults;
        if (offline) {
            qualitativeResults = {
                resumenEjecutivo: {},
                introduccion: 'Generación offline: textos de IA omitidos.',
                brechaDigital: {},
                madurezDigital: {},
                competenciasDigitales: {},
                usoInteligenciaArtificial: {},
                culturaOrganizacional: {},
                planAccion: { resumenGeneral: 'Generación offline.', iniciativas: [] },
            };
        } else {
            qualitativeResults = await performQualitativeAnalysis(provider, aiClient, effectiveModelName, quantitativeResults, openEndedAnalysis || null);
        }
        // Si la IA falló y no devolvió analisisCualitativo, inyectar el caché directamente
        if (openEndedAnalysis && !qualitativeResults.analisisCualitativo) {
            qualitativeResults.analisisCualitativo = openEndedAnalysis;
        }

        // 5. Construir y Guardar el Reporte
        console.log('Generando el archivo JSON del reporte...');
        // Determinar el modo de generación para trazabilidad
        const generationMode = offline ? 'offline' : (qualitativeResults.__generationMode || 'online');

        const reportJson = generateReportJson(quantitativeResults, qualitativeResults, totalRespondents, empresaNombre, reportId, provider, effectiveModelName, generationMode);
        // Validación del reporte final contra el esquema
        try {
          validateData(reportJson, 'report');
          console.log('✅ Reporte final válido.');
        } catch (ve) {
          console.error(`\n❌ Reporte final inválido: ${ve.message}\n`);
          process.exit(1);
        }

        const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', `globalData.${provider}.json`);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reportJson, null, 2), 'utf8');
        
        console.log(`✅ Reporte generado exitosamente en: ${OUTPUT_PATH}`);

    } catch (error) {
        console.error(`❌ Error durante la generación del reporte: ${error.message}`);
        process.exit(1);
    }
}

main();
