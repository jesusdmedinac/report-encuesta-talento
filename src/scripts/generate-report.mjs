import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

// --- Constantes y Configuraciones ---
const MAPPINGS_PATH = path.join(process.cwd(), 'src', 'scripts', 'mappings.json');
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'globalData.json');
const TEMPLATE_PATH = path.join(process.cwd(), 'src', 'data', 'globalData.json');


const PII_COLUMNS = [
    '#', 'DEMO_CONSENT: Política de privacidad de datos', 'DEMO_CONTACT: Nombre',
    'DEMO_CONTACT: Apellido', 'DEMO_CONTACT: Email', 'DEMO_PROFESSIONAL: Departamento:',
    'DEMO_PROFESSIONAL: Nivel de estudios:', 'DEMO_PROFESSIONAL: Menciona el rol que cumples en tu empresa:',
    'DEMO_PROFESSIONAL: Menciona cuáles son las tres principales responsabilidades o actividades que desempeñas en ese rol:',
    'DEMO_PROFESSIONAL: Other', 'DEMO_PROFESSIONAL: ¿Hacia qué posición, área o tipo de rol aspiras llegar en tu desarrollo profesional?',
    'DEMO_PROFESSIONAL: Género:', 'DEMO_PROFESSIONAL: Rango de Edad:',
    'D1_OPEN: Si pudieras describir tu viaje de aprendizaje digital en una frase, ¿cuál sería?',
    'D2_OPEN: Pensando en las herramientas que usas a diario, ¿qué te ayudaría a ser más eficiente: una nueva herramienta, más capacitación en las actuales, o algo diferente?',
    'D3_OPEN: Desde tu perspectiva, ¿qué es lo más importante que la empresa podría hacer para acelerar nuestra cultura digital?',
    'D4_OPEN: Pensando en el futuro, ¿cuál es tu mayor expectativa o preocupación sobre el uso de la Inteligencia Artificial en tu rol?'
];


// --- Funciones de Utilidad ---

function getArgument(argName) {
    const arg = process.argv.find(a => a.startsWith(argName + '='));
    return arg ? arg.split('=')[1] : null;
}

function loadJson(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error al cargar el archivo JSON en ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

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

        return parsedData.data.map(row => {
            const newRow = {};
            for (const key in row) {
                if (!PII_COLUMNS.includes(key.trim())) {
                    newRow[key.trim()] = row[key];
                }
            }
            return newRow;
        });

    } catch (error) {
        console.error(`Error al leer o procesar el archivo CSV: ${error.message}`);
        process.exit(1);
    }
}

const calculateAverage = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
};

// --- Lógica Principal de Análisis ---

function performQuantitativeAnalysis(data, mappings) {
    const scores = {};

    // Inicializar dinámicamente la estructura de scores
    for (const question in mappings) {
        const { dimension, subDimension } = mappings[question];
        if (!scores[dimension]) {
            scores[dimension] = {};
        }
        if (!scores[dimension][subDimension]) {
            scores[dimension][subDimension] = [];
        }
    }

    // Acumular puntuaciones
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

    // Calcular promedios
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

function generateReportJson(analysisResults, totalRespondents) {
    const template = loadJson(TEMPLATE_PATH);

    // --- Calcular Promedios Generales ---
    const madurezDigitalAvg = calculateAverage(Object.values(analysisResults.madurezDigital));
    const brechaDigitalAvg = calculateAverage(Object.values(analysisResults.brechaDigital));
    const usoInteligenciaArtificialAvg = calculateAverage(Object.values(analysisResults.usoInteligenciaArtificial));
    const culturaOrganizacionalAvg = calculateAverage(Object.values(analysisResults.culturaOrganizacional));
    const overallAvg = calculateAverage([madurezDigitalAvg, brechaDigitalAvg, usoInteligenciaArtificialAvg, culturaOrganizacionalAvg]);

    // --- Actualizar Header ---
    template.header.empleadosEvaluados = totalRespondents.toString();

    // --- Actualizar Resumen Ejecutivo ---
    template.resumenEjecutivo.puntuacionGeneral.puntuacion = parseFloat(overallAvg.toFixed(1));
    template.resumenEjecutivo.puntuacionesDimensiones = [
        { nombre: "Madurez Digital", puntuacion: parseFloat(madurezDigitalAvg.toFixed(1)), color: "#F59E0B" },
        { nombre: "Competencias Digitales", puntuacion: parseFloat(brechaDigitalAvg.toFixed(1)), color: "#EF4444" },
        { nombre: "Uso de IA", puntuacion: parseFloat(usoInteligenciaArtificialAvg.toFixed(1)), color: "#8B5CF6" },
        { nombre: "Cultura Digital", puntuacion: parseFloat(culturaOrganizacionalAvg.toFixed(1)), color: "#10B981" }
    ];
    
    // --- Actualizar Brecha Digital ---
    template.brechaDigital.puntuacionEmpresa = parseFloat(overallAvg.toFixed(1));

    // --- Actualizar Madurez Digital ---
    template.madurezDigital.puntuacionGeneral = parseFloat(madurezDigitalAvg.toFixed(1));
    template.madurezDigital.componentes = Object.entries(analysisResults.madurezDigital).map(([key, value]) => ({
        nombre: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        puntuacion: value,
        descripcion: `Puntuación de ${value.toFixed(2)}/4.0 en ${key}.`,
        color: "var(--color-company)",
        colorGradiente: "#4387ff",
        meta: 3.75
    }));

    // --- Actualizar Competencias Digitales (ahora Brecha Digital) ---
    template.competenciasDigitales.promedio = parseFloat(brechaDigitalAvg.toFixed(1));
    template.competenciasDigitales.competencias = Object.entries(analysisResults.brechaDigital).map(([key, value]) => ({
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        score: Math.round((value / 4) * 100),
        color: '#3498db', // Color genérico, se puede mejorar
        description: `Nivel de desarrollo en ${key}.`
    }));

    // --- Actualizar Uso de IA ---
    const iaAdopcion = calculateAverage([
        analysisResults.usoInteligenciaArtificial.interesEnAprendizaje,
        analysisResults.usoInteligenciaArtificial.percepcionDeRiesgo,
        analysisResults.usoInteligenciaArtificial.nivelDeAdopcion
    ]);
    const iaUso = calculateAverage([
        analysisResults.usoInteligenciaArtificial.frecuenciaDeUso,
        analysisResults.usoInteligenciaArtificial.habilidadDeUso
    ]);
    const iaEtica = analysisResults.usoInteligenciaArtificial.eticaYVerificacion;

    template.usoInteligenciaArtificial.graficos[0].porcentaje = Math.round((iaAdopcion / 4) * 100);
    template.usoInteligenciaArtificial.graficos[1].porcentaje = Math.round((iaUso / 4) * 100);
    template.usoInteligenciaArtificial.graficos[2].porcentaje = Math.round((iaEtica / 4) * 100);

    // --- Actualizar Cultura Organizacional ---
    const culturaLiderazgo = calculateAverage([analysisResults.culturaOrganizacional.liderazgoYVision, analysisResults.culturaOrganizacional.reconocimiento]);
    const culturaFormacion = calculateAverage([analysisResults.culturaOrganizacional.ambienteDeAprendizaje, analysisResults.culturaOrganizacional.apoyoOrganizacional]);
    const culturaApertura = analysisResults.culturaOrganizacional.experimentacion;

    template.culturaOrganizacional.tarjetas[0].puntuacion = parseFloat(culturaApertura.toFixed(1));
    template.culturaOrganizacional.tarjetas[1].puntuacion = parseFloat(culturaFormacion.toFixed(1));
    template.culturaOrganizacional.tarjetas[2].puntuacion = parseFloat(culturaLiderazgo.toFixed(1));

    // --- Añadir Scores de Roles Específicos ---
    template.roleSpecificScores = {};
    Object.keys(analysisResults)
        .filter(dim => dim.startsWith('rol'))
        .forEach(dim => {
            template.roleSpecificScores[dim] = analysisResults[dim];
        });


    return template;
}


// --- Punto de Entrada Principal ---

function main() {
    console.log('Iniciando la generación del reporte...');

    const csvFilePath = getArgument('--csv');
    if (!csvFilePath) {
        console.error('Error: Debes proporcionar la ruta al archivo CSV usando el argumento --csv.');
        console.error('Ejemplo: node src/scripts/generate-report.mjs --csv=./data/respuestas-por-puntos.csv');
        process.exit(1);
    }

    console.log(`Cargando mapeos desde: ${MAPPINGS_PATH}`);
    const mappings = loadJson(MAPPINGS_PATH);

    console.log(`Cargando y limpiando datos desde: ${csvFilePath}`);
    const surveyData = loadCsv(csvFilePath);

    if (!surveyData || surveyData.length === 0) {
        console.error('No se encontraron datos válidos en el archivo CSV.');
        process.exit(1);
    }
    console.log(`Se encontraron ${surveyData.length} filas de datos limpios.`);

    console.log('Realizando análisis cuantitativo...');
    const quantitativeResults = performQuantitativeAnalysis(surveyData, mappings);

    console.log('Generando el archivo JSON del reporte...');
    const reportJson = generateReportJson(quantitativeResults, surveyData.length);

    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reportJson, null, 2), 'utf8');
        console.log(`Reporte generado exitosamente en: ${OUTPUT_PATH}`);
    } catch (error) {
        console.error(`Error al escribir el archivo JSON: ${error.message}`);
        process.exit(1);
    }
}

main();