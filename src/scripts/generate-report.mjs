import fs from 'fs';
import path from 'path';

// Importaciones desde los nuevos módulos de refactorización
import { MAPPINGS_PATH } from './config.js';
import { getArgument, loadJson } from './utils.js';
import { loadAndProcessCsv, performQuantitativeAnalysis } from './services/csv-processor.js';
import { initializeAiClient, performQualitativeAnalysis } from './services/ai-analyzer.js';
import { generateReportJson } from './services/report-builder.js';

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

        if (!csvFilePath || !empresaNombre || !reportId) {
            throw new Error('Faltan argumentos obligatorios. Se requiere --csv, --empresa, y --reportId.');
        }

        // 2. Inicializar Cliente de IA
        const { aiClient, effectiveModelName } = initializeAiClient(provider, modelName);

        // 3. Cargar y Procesar Datos
        console.log(`Cargando mapeos desde: ${MAPPINGS_PATH}`);
        const mappings = loadJson(MAPPINGS_PATH);

        console.log(`Cargando y procesando datos desde: ${csvFilePath}`);
        const { quantitativeData, openEndedData } = loadAndProcessCsv(csvFilePath);

        // 4. Realizar Análisis
        console.log('Realizando análisis cuantitativo...');
        const quantitativeResults = performQuantitativeAnalysis(quantitativeData, mappings);
        // TODO: Usar openEndedData en el análisis cualitativo

        console.log('Realizando análisis cualitativo...');
        const qualitativeResults = await performQualitativeAnalysis(provider, aiClient, effectiveModelName, quantitativeResults);

        // 5. Construir y Guardar el Reporte
        console.log('Generando el archivo JSON del reporte...');
        const reportJson = generateReportJson(quantitativeResults, qualitativeResults, quantitativeData.length, empresaNombre, reportId);

        const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', `globalData.${provider}.json`);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reportJson, null, 2), 'utf8');
        
        console.log(`
✅ Reporte generado exitosamente en: ${OUTPUT_PATH}
`);

    } catch (error) {
        console.error(`
❌ Error durante la generación del reporte: ${error.message}
`);
        process.exit(1);
    }
}

main();