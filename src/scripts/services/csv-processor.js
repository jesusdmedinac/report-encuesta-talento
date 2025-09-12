import fs from 'fs';
import Papa from 'papaparse';
import { ALL_NON_QUANTITATIVE_COLUMNS, OPEN_ENDED_QUESTIONS } from '../config.js';

/**
 * Parsea el contenido de un archivo CSV y maneja los errores de parseo.
 * @param {string} filePath - Ruta al archivo CSV.
 * @returns {Array} - Un array de objetos, donde cada objeto es una fila del CSV.
 */
function parseCsvFile(filePath) {
    try {
        const csvFileContent = fs.readFileSync(filePath, 'utf8');
        const parsedData = Papa.parse(csvFileContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parsedData.errors.length > 0) {
            console.error('Errores durante el parseo del CSV:');
            parsedData.errors.forEach(error => console.error(error));
            throw new Error('No se pudo parsear el archivo CSV correctamente.');
        }

        return parsedData.data;
    } catch (error) {
        console.error(`Error al leer o procesar el archivo CSV: ${error.message}`);
        throw error; // Re-lanza el error para que sea manejado centralmente
    }
}

/**
 * Separa las filas de datos crudos en datos cuantitativos y respuestas a preguntas abiertas.
 * @param {Array} rows - Array de filas del CSV parseado.
 * @returns {{quantitativeData: Array, openEndedData: Object}} - Datos separados.
 */
function processSurveyData(rows) {
    const quantitativeData = [];
    const openEndedData = {};
    Object.keys(OPEN_ENDED_QUESTIONS).forEach(key => openEndedData[key] = []);

    for (const row of rows) {
        const quantRow = {};
        for (const key in row) {
            const trimmedKey = key.trim();
            if (!ALL_NON_QUANTITATIVE_COLUMNS.includes(trimmedKey)) {
                quantRow[trimmedKey] = row[key];
            } else {
                for (const open_key in OPEN_ENDED_QUESTIONS) {
                    if (OPEN_ENDED_QUESTIONS[open_key] === trimmedKey && row[key]) {
                        openEndedData[open_key].push(row[key]);
                    }
                }
            }
        }
        quantitativeData.push(quantRow);
    }

    return { quantitativeData, openEndedData };
}

/**
 * Orquestador para cargar y procesar los datos de la encuesta desde un CSV.
 * @param {string} filePath - Ruta al archivo CSV.
 * @returns {{quantitativeData: Array, openEndedData: Object}} - Datos procesados y listos para análisis.
 */
export function loadAndProcessCsv(filePath) {
    const rawData = parseCsvFile(filePath);
    if (!rawData || rawData.length === 0) {
        throw new Error('No se encontraron datos válidos en el archivo CSV.');
    }
    console.log(`Se encontraron ${rawData.length} filas de datos crudos.`);
    return processSurveyData(rawData);
}


import { calculateAverage } from '../utils.js';

/**
 * Realiza el análisis cuantitativo, calculando promedios por dimensión y sub-dimensión.
 * @param {Array} data - Los datos cuantitativos de la encuesta.
 * @param {Object} mappings - El objeto de mapeo de preguntas a dimensiones.
 * @returns {Object} - Un objeto con los puntajes promedio calculados.
 */
export function performQuantitativeAnalysis(data, mappings) {
    const scores = {};

    // Inicializar la estructura de scores a partir de los mappings
    for (const question in mappings) {
        const { dimension, subDimension } = mappings[question];
        if (!scores[dimension]) {
            scores[dimension] = {};
        }
        if (!scores[dimension][subDimension]) {
            scores[dimension][subDimension] = [];
        }
    }

    // Llenar los scores con los datos de la encuesta
    for (const row of data) {
        for (const question in row) {
            const mapping = mappings[question];
            if (mapping) {
                const score = parseInt(row[question], 10);
                if (!isNaN(score)) {
                    scores[mapping.dimension][mapping.subDimension].push(score);
                }
            }
        }
    }

    // Calcular el promedio para cada sub-dimensión
    const results = {};
    for (const dimension in scores) {
        results[dimension] = {};
        for (const subDimension in scores[dimension]) {
            const average = calculateAverage(scores[dimension][subDimension]);
            results[dimension][subDimension] = parseFloat(average.toFixed(2));
        }
    }

    return results;
}
