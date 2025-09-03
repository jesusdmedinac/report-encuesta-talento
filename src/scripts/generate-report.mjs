import fs from 'fs';
import Papa from 'papaparse';

// --- Constantes y Configuraciones ---

const MAPPINGS_PATH = './src/scripts/mappings.json';
const PII_COLUMNS = [
  '#',
  'Política de privacidad de datos',
  'Nombre',
  'Apellido',
  'Email',
  'Departamento:',
  'Nivel de estudios:',
  'Menciona el rol que cumples en tu empresa:',
  'Menciona cuáles son las tres principales responsabilidades o actividades que desempeñas en ese rol:',
  'Other',
  '¿Hacia qué posición, área o tipo de rol aspiras llegar en tu desarrollo profesional?',
  'Género:',
  'Rango de Edad:',
  'Si pudieras describir tu viaje de aprendizaje digital en una frase, ¿cuál sería?',
  '¿Qué es lo más importante que la empresa podría hacer para acelerar nuestra cultura digital? (Opcional)',
  '¿Hay alguna habilidad digital que no hayamos mencionado y que consideres crucial para el futuro de tu rol o de la empresa? (Opcional)',
  'En tu opinión, ¿cuál es el mayor obstáculo para la adopción de nuevas tecnologías en la empresa? (Opcional)',
  '¿Qué tipo de apoyo o recurso adicional te ayudaría a sentirte más seguro/a utilizando herramientas de IA en tu trabajo? (Opcional)'
];


// --- Funciones de Utilidad ---

/**
 * Parsea los argumentos de la línea de comandos para encontrar un valor específico.
 * @param {string} argName - El nombre del argumento a buscar (ej. --csv).
 * @returns {string|null} - El valor del argumento o null si no se encuentra.
 */
function getArgument(argName) {
  const arg = process.argv.find(a => a.startsWith(argName + '='));
  return arg ? arg.split('=')[1] : null;
}

/**
 * Carga y parsea un archivo JSON.
 * @param {string} filePath - Ruta al archivo JSON.
 * @returns {object} - El objeto JSON parseado.
 */
function loadJson(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error al cargar el archivo JSON en ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Carga y parsea un archivo CSV.
 * @param {string} filePath - Ruta al archivo CSV.
 * @returns {Array<object>} - Un array de objetos representando las filas del CSV.
 */
function loadCsv(filePath) {
  try {
    const csvFileContent = fs.readFileSync(filePath, 'utf8');
    const parsedData = Papa.parse(csvFileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsedData.errors.length > 0) {
      console.error('Errores durante el parseo del CSV:');
      parsedData.errors.forEach(error => console.error(error));
      process.exit(1);
    }
    
    // Filtrar columnas PII de cada fila
    const cleanData = parsedData.data.map(row => {
      const newRow = {};
      for (const key in row) {
        if (!PII_COLUMNS.includes(key)) {
          newRow[key] = row[key];
        }
      }
      return newRow;
    });

    return cleanData;
  } catch (error) {
    console.error(`Error al leer o procesar el archivo CSV: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Calcula el promedio de un array de números.
 * @param {Array<number>} arr - El array de números.
 * @returns {number} - El promedio, o 0 si el array está vacío.
 */
const calculateAverage = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
};


// --- Lógica Principal de Análisis ---

/**
 * Procesa las respuestas de la encuesta para calcular las puntuaciones cuantitativas.
 * @param {Array<object>} data - Los datos del CSV parseado.
 * @param {object} mappings - El objeto de mapeo de preguntas a dimensiones.
 * @returns {object} - Un objeto con todas las puntuaciones calculadas.
 */
function performQuantitativeAnalysis(data, mappings) {
  const scores = {
    madurezDigital: {
      actitudFrenteANuevasTecnologias: [],
      capacidadParaAprender: [],
    },
    competenciasDigitales: {
      comunicacionYColaboracion: [],
      pensamientoCritico: [],
      resolucionDeProblemas: [],
      creacionDeContenido: [],
      ciberseguridad: [],
      resilienciaYFlexibilidad: [],
      agilidadDigital: [],
      marketingDigital: [],
      analisisDeDatos: [],
      alfabetizacionTecnologica: [],
    },
    culturaOrganizacional: {
      formacionYDesarrollo: [],
      liderazgoYVision: [],
      aperturaTecnologica: [],
    },
    usoInteligenciaArtificial: {
      adopcion: [],
      usoEnElTrabajo: [],
      etica: [],
    },
  };

  // 1. Acumular puntuaciones
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

  // 2. Calcular promedios
  const results = {};
  for (const dimension in scores) {
    results[dimension] = {};
    for (const subDimension in scores[dimension]) {
      const average = calculateAverage(scores[dimension][subDimension]);
      // Escalar a 10 si es necesario, o mantener en 4 para algunos casos.
      // Por ahora, mantenemos el promedio sobre 4.
      results[dimension][subDimension] = parseFloat(average.toFixed(2));
    }
  }

  return results;
}


// --- Punto de Entrada Principal ---

/**
 * Función principal del script.
 */
function main() {
  console.log('Iniciando la generación del reporte...');

  const csvFilePath = getArgument('--csv');
  if (!csvFilePath) {
    console.error('Error: Debes proporcionar la ruta al archivo CSV usando el argumento --csv.');
    console.error('Ejemplo: node src/scripts/generate-report.mjs --csv=./data/respuestas.csv');
    process.exit(1);
  }

  console.log(`Cargando mapeos desde: ${MAPPINGS_PATH}`);
  const mappings = loadJson(MAPPINGS_PATH);

  console.log(`Cargando y limpiando datos desde: ${csvFilePath}`);
  const surveyData = loadCsv(csvFilePath);
  
  console.log(`Se encontraron ${surveyData.length} filas de datos limpios.`);

  console.log('Fase 2: Realizando análisis cuantitativo...');
  const quantitativeResults = performQuantitativeAnalysis(surveyData, mappings);

  console.log('--- Resultados del Análisis Cuantitativo ---');
  console.log(JSON.stringify(quantitativeResults, null, 2));
  console.log('-------------------------------------------');

  console.log('Fase 2 completada. Los resultados se muestran arriba.');
  // Las siguientes fases (análisis cualitativo y generación de JSON) irán aquí.
}

main();
