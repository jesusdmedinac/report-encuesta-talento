import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Cache de validadores compilados por nombre de esquema para evitar recompilaciones
const compiledCache = new Map();

/**
 * Valida un objeto de datos contra un esquema JSON especificado.
 * @param {object} data El objeto de datos a validar.
 * @param {string} schemaName El nombre del archivo de esquema (sin .json) a usar para la validación.
 * @returns {boolean} Devuelve true si la validación es exitosa.
 * @throws {Error} Lanza un error con detalles si la validación falla.
 */
export function validateData(data, schemaName) {
  const schemaPath = path.resolve(__dirname, '../schemas', `${schemaName}.schema.json`);
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`El archivo de esquema no se encontró en: ${schemaPath}`);
  }

  let validate = compiledCache.get(schemaName);
  if (!validate) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    validate = ajv.compile(schema);
    compiledCache.set(schemaName, validate);
  }
  const valid = validate(data);

  if (!valid) {
    const errorMessages = validate.errors.map(error => {
      return `${error.instancePath || 'root'} ${error.message}`;
    });
    throw new Error(`Error de validación de esquema para '${schemaName}':\n- ${errorMessages.join('\n- ')}`);
  }

  return true;
}
