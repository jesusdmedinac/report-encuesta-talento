import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// --- Constantes y Configuraciones ---
const MAPPINGS_PATH = path.join(process.cwd(), 'src', 'scripts', 'mappings.json');
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

const scaleToTen = (score) => score * 2.5;

// --- Lógica Principal de Análisis ---

function performQuantitativeAnalysis(data, mappings) {
    const scores = {};

    for (const question in mappings) {
        const { dimension, subDimension } = mappings[question];
        if (!scores[dimension]) {
            scores[dimension] = {};
        }
        if (!scores[dimension][subDimension]) {
            scores[dimension][subDimension] = [];
        }
    }

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

async function performQualitativeAnalysis(provider, aiClient, modelName, quantitativeResults) {
    console.log('Iniciando análisis cualitativo con IA...');
    const insights = {};

    const summaryPrompt = `
        Eres un consultor experto en transformación digital.
        Basado en los siguientes resultados cuantitativos de una encuesta de madurez digital,
        donde la puntuación va de 1 (muy en desacuerdo) a 4 (muy de acuerdo),
        genera un resumen ejecutivo conciso y profesional de 3 párrafos.

        Resultados Cuantitativos (promedios de 1 a 4):
        ${JSON.stringify(quantitativeResults, null, 2)}

        El resumen debe ser accionable, escrito en un tono de experto a cliente, y resaltar 
        las áreas clave de fortaleza y debilidad sin usar un lenguaje demasiado técnico.
        Finaliza con una nota optimista sobre el potencial de mejora.
    `;

    try {
        console.log('Generando resumen ejecutivo...');
        let generatedText = "";

        switch (provider) {
            case 'gemini':
                const geminiResult = await aiClient.generateContent(summaryPrompt);
                const geminiResponse = await geminiResult.response;
                generatedText = geminiResponse.text();
                break;

            case 'openai':
                const openAIResult = await aiClient.chat.completions.create({
                    model: modelName,
                    messages: [{ role: 'user', content: summaryPrompt }],
                });
                generatedText = openAIResult.choices[0].message.content;
                break;
        }

        insights.resumenEjecutivo = generatedText;
        console.log('Resumen ejecutivo generado por IA.');

    } catch (error) {
        console.error(`Error al generar el resumen ejecutivo con ${provider}:`, error);
        insights.resumenEjecutivo = `No se pudo generar el resumen ejecutivo con ${provider}. Por favor, revise la configuración de la API y los logs del modelo.`;
    }

    return insights;
}

function generateReportJson(analysisResults, qualitativeResults, totalRespondents, empresaNombre, reportId) {
    const template = loadJson(TEMPLATE_PATH);

    // --- Integración de Análisis Cualitativo ---
    template.resumenEjecutivo.resumenGeneral = qualitativeResults.resumenEjecutivo;


    const madurezDigitalAvg = calculateAverage(Object.values(analysisResults.madurezDigital));
    const brechaDigitalAvg = calculateAverage(Object.values(analysisResults.brechaDigital));
    const usoInteligenciaArtificialAvg = calculateAverage(Object.values(analysisResults.usoInteligenciaArtificial));
    const culturaOrganizacionalAvg = calculateAverage(Object.values(analysisResults.culturaOrganizacional));
    const overallAvg = calculateAverage([madurezDigitalAvg, brechaDigitalAvg, usoInteligenciaArtificialAvg, culturaOrganizacionalAvg]);

    // --- Actualización del Header ---
    const hoy = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    template.header.empresa = empresaNombre;
    template.header.fechaDiagnostico = hoy.toLocaleDateString('es-ES', opcionesFecha);
    template.header.titulo = `Reporte de Transformación Digital para ${empresaNombre}`;
    template.header.idReporte = reportId;
    template.header.empleadosEvaluados = totalRespondents.toString();


    template.resumenEjecutivo.puntuacionGeneral.puntuacion = parseFloat(scaleToTen(overallAvg).toFixed(1));
    template.resumenEjecutivo.puntuacionesDimensiones = [
        { nombre: "Madurez Digital", puntuacion: parseFloat(scaleToTen(madurezDigitalAvg).toFixed(1)), color: "#F59E0B" },
        { nombre: "Competencias Digitales", puntuacion: parseFloat(scaleToTen(brechaDigitalAvg).toFixed(1)), color: "#EF4444" },
        { nombre: "Uso de IA", puntuacion: parseFloat(scaleToTen(usoInteligenciaArtificialAvg).toFixed(1)), color: "#8B5CF6" },
        { nombre: "Cultura Digital", puntuacion: parseFloat(scaleToTen(culturaOrganizacionalAvg).toFixed(1)), color: "#10B981" }
    ];
    
    template.brechaDigital.puntuacionEmpresa = parseFloat(scaleToTen(overallAvg).toFixed(1));
    template.brechaDigital.puntuacionMetaSector = 9.38; // 3.75 * 2.5
    template.brechaDigital.nombreEmpresa = empresaNombre;

    template.madurezDigital.puntuacionGeneral = parseFloat(scaleToTen(madurezDigitalAvg).toFixed(1));
    template.madurezDigital.componentes = Object.entries(analysisResults.madurezDigital).map(([key, value]) => ({
        nombre: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        puntuacion: parseFloat(scaleToTen(value).toFixed(1)),
        descripcion: `Puntuación de ${parseFloat(scaleToTen(value).toFixed(2))}/10 en ${key}.`,
        color: "var(--color-company)",
        colorGradiente: "#4387ff",
        meta: 9.38 // 3.75 * 2.5
    }));
    template.madurezDigital.nombreEmpresa = empresaNombre;

    template.competenciasDigitales.promedio = parseFloat(scaleToTen(brechaDigitalAvg).toFixed(1));
    template.competenciasDigitales.competencias = Object.entries(analysisResults.brechaDigital).map(([key, value]) => ({
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        score: Math.round((value / 4) * 100),
        color: '#3498db',
        description: `Nivel de desarrollo en ${key}.`
    }));

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

    const culturaLiderazgo = calculateAverage([analysisResults.culturaOrganizacional.liderazgoYVision, analysisResults.culturaOrganizacional.reconocimiento]);
    const culturaFormacion = calculateAverage([analysisResults.culturaOrganizacional.ambienteDeAprendizaje, analysisResults.culturaOrganizacional.apoyoOrganizacional]);
    const culturaApertura = analysisResults.culturaOrganizacional.experimentacion;

    template.culturaOrganizacional.tarjetas[0].puntuacion = parseFloat(scaleToTen(culturaApertura).toFixed(1));
    template.culturaOrganizacional.tarjetas[1].puntuacion = parseFloat(scaleToTen(culturaFormacion).toFixed(1));
    template.culturaOrganizacional.tarjetas[2].puntuacion = parseFloat(scaleToTen(culturaLiderazgo).toFixed(1));

    template.roleSpecificScores = {};
    Object.keys(analysisResults)
        .filter(dim => dim.startsWith('rol'))
        .forEach(dim => {
            template.roleSpecificScores[dim] = {};
            for (const subDim in analysisResults[dim]) {
                template.roleSpecificScores[dim][subDim] = parseFloat(scaleToTen(analysisResults[dim][subDim]).toFixed(2));
            }
        });

    return template;
}


// --- Punto de Entrada Principal ---

async function main() {
    console.log('Iniciando la generación del reporte...');

    const provider = getArgument('--provider') || 'gemini';
    const modelName = getArgument('--model');

    let aiClient;
    let effectiveModelName;

    console.log(`Usando el proveedor de IA: ${provider}`);

    switch (provider) {
        case 'gemini':
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                console.error('Error: La variable de entorno GEMINI_API_KEY no está configurada.');
                process.exit(1);
            }
            effectiveModelName = modelName || 'gemini-1.5-flash';
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            aiClient = genAI.getGenerativeModel({ model: effectiveModelName });
            break;

        case 'openai':
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
                console.error('Error: La variable de entorno OPENAI_API_KEY no está configurada.');
                process.exit(1);
            }
            effectiveModelName = modelName || 'gpt-4o';
            aiClient = new OpenAI({ apiKey: openaiApiKey });
            break;

        default:
            console.error(`Error: Proveedor de IA no soportado: ${provider}. Soportados: 'gemini', 'openai'.`);
            process.exit(1);
    }

    console.log(`Cliente de IA inicializado con el modelo: ${effectiveModelName}.`);

    const csvFilePath = getArgument('--csv');
    const empresaNombre = getArgument('--empresa');
    const reportId = getArgument('--reportId');

    if (!csvFilePath || !empresaNombre || !reportId) {
        console.error('Error: Faltan argumentos obligatorios.');
        console.error('Ejemplo: node src/scripts/generate-report.mjs --csv=./data/respuestas.csv --empresa="Mi Empresa" --reportId="REP001" --provider=gemini');
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

    console.log('Realizando análisis cualitativo...');
    const qualitativeResults = await performQualitativeAnalysis(provider, aiClient, effectiveModelName, quantitativeResults);

    console.log('Generando el archivo JSON del reporte...');
    const reportJson = generateReportJson(quantitativeResults, qualitativeResults, surveyData.length, empresaNombre, reportId);

    try {
        const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', `globalData.${provider}.json`);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reportJson, null, 2), 'utf8');
        console.log(`Reporte generado exitosamente en: ${OUTPUT_PATH}`);
    } catch (error) {
        console.error(`Error al escribir el archivo JSON: ${error.message}`);
        process.exit(1);
    }
}

main();
