import fs from 'fs';
import Papa from 'papaparse';
import { ALL_NON_QUANTITATIVE_COLUMNS, OPEN_ENDED_QUESTIONS } from '../config.js';

/**
 * Parsea el contenido de un archivo CSV y maneja los errores de parseo.
 * @param {string} filePath - Ruta al archivo CSV.
 * @returns {Array} - Un array de objetos, donde cada objeto es una fila del CSV.
 */
export function parseCsvFile(filePath) {
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
    const openEndedDataRaw = {};
    Object.keys(OPEN_ENDED_QUESTIONS).forEach(key => openEndedDataRaw[key] = []);

    for (const row of rows) {
        const quantRow = {};
        for (const key in row) {
            const trimmedKey = key.trim();
            if (!ALL_NON_QUANTITATIVE_COLUMNS.includes(trimmedKey)) {
                quantRow[trimmedKey] = row[key];
            } else {
                for (const open_key in OPEN_ENDED_QUESTIONS) {
                    if (OPEN_ENDED_QUESTIONS[open_key] === trimmedKey && row[key]) {
                        openEndedDataRaw[open_key].push(String(row[key]));
                    }
                }
            }
        }
        quantitativeData.push(quantRow);
    }

    const openEndedData = cleanOpenEndedData(openEndedDataRaw);
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

// --- Utilidades de limpieza/anonomización de texto libre ---

function normalizeText(t) {
    return String(t)
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
}

function anonymizeText(t) {
    let s = t;
    // Emails
    s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]');
    // Teléfonos (7+ dígitos, con separadores comunes)
    s = s.replace(/\b(?:\+?\d[\d\s().-]{6,}\d)\b/g, '[TEL]');
    // Menciones @usuario
    s = s.replace(/@[a-z0-9_\-.]+/gi, '[USER]');
    return s;
}

function isNoisyOrTooShort(t) {
    if (!t) return true;
    const len = t.length;
    if (len < 5) return true; // muy corto
    // evitar respuestas triviales
    const lower = t.toLowerCase();
    const trivial = ['na', 'n/a', 'ninguna', 'no', 'none', 'sin', '—', '-', 'n/a.', 'ninguno'];
    if (trivial.includes(lower)) return true;
    return false;
}

function deduplicate(arr) {
    const seen = new Set();
    const out = [];
    for (const item of arr) {
        const key = item.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push(item);
        }
    }
    return out;
}

function cleanOpenEndedData(openEndedDataRaw) {
    const cleaned = {};
    for (const key of Object.keys(openEndedDataRaw)) {
        const arr = openEndedDataRaw[key]
            .map(normalizeText)
            .map(anonymizeText)
            .filter(x => !isNoisyOrTooShort(x));
        cleaned[key] = deduplicate(arr);
    }
    return cleaned;
}
