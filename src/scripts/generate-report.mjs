import fs from 'fs';
import Papa from 'papaparse';

// Punto de entrada para la generación del reporte de madurez digital.

/**
 * Parsea los argumentos de la línea de comandos para encontrar un valor específico.
 * Ejemplo: node generate-report.js --csv=./data.csv
 * @param {string} argName - El nombre del argumento a buscar (ej. --csv).
 * @returns {string|null} - El valor del argumento o null si no se encuentra.
 */
function getArgument(argName) {
  const arg = process.argv.find(a => a.startsWith(argName + '='));
  if (!arg) {
    return null;
  }
  return arg.split('=')[1];
}

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

  console.log(`Cargando datos desde: ${csvFilePath}`);

  try {
    const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
    const parsedData = Papa.parse(csvFileContent, {
      header: true, // Trata la primera fila como encabezados
      skipEmptyLines: true,
    });

    if (parsedData.errors.length > 0) {
      console.error('Errores durante el parseo del CSV:');
      parsedData.errors.forEach(error => console.error(error));
      process.exit(1);
    }

    console.log('Archivo CSV parseado exitosamente.');
    console.log(`Se encontraron ${parsedData.data.length} filas de datos.`);
    
    // Para verificar, imprimimos las primeras 2 filas de datos.
    console.log('Ejemplo de datos parseados:');
    console.log(parsedData.data.slice(0, 2));

    // Aquí irán las siguientes fases del plan.

  } catch (error) {
    console.error(`Error al leer o procesar el archivo: ${error.message}`);
    process.exit(1);
  }
}

main();