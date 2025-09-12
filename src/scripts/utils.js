import fs from 'fs';

/**
 * Obtiene el valor de un argumento pasado por línea de comandos.
 * @param {string} argName - El nombre del argumento (ej. '--csv').
 * @returns {string|null} - El valor del argumento o null si no se encuentra.
 */
export function getArgument(argName) {
    const arg = process.argv.find(a => a.startsWith(argName + '='));
    return arg ? arg.split('=')[1] : null;
}

/**
 * Carga y parsea un archivo JSON desde la ruta especificada.
 * @param {string} filePath - Ruta al archivo JSON.
 * @returns {Object} - El objeto JavaScript parseado.
 */
export function loadJson(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error al cargar el archivo JSON en ${filePath}: ${error.message}`);
        throw error; // Re-lanza para manejo centralizado
    }
}

/**
 * Calcula el promedio de un array de números.
 * @param {Array<number>} arr - El array de números.
 * @returns {number} - El promedio.
 */
export const calculateAverage = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
};

/**
 * Escala una puntuación de una base 1-4 a una base 0-10.
 * @param {number} score - La puntuación original (1-4).
 * @returns {number} - La puntuación escalada a 10.
 */
export const scaleToTen = (score) => score * 2.5;

/**
 * Formatea un string en camelCase a Title Case (ej. "liderazgoYVision" -> "Liderazgo Y Vision").
 * @param {string} key - El string en camelCase.
 * @returns {string} - El string formateado.
 */
export const formatDimensionName = (key) => {
    if (!key) return '';
    const spaced = key.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};
