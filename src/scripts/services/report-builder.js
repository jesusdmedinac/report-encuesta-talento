import { TEMPLATE_PATH } from '../config.js';
import { loadJson, calculateAverage, scaleToTen, formatDimensionName } from '../utils.js';

// --- Funciones "Constructoras" por Sección ---

function buildHeader(empresaNombre, reportId, totalRespondents) {
    const hoy = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return {
        empresa: empresaNombre,
        fechaDiagnostico: hoy.toLocaleDateString('es-ES', opcionesFecha),
        titulo: `Reporte de Transformación Digital para ${empresaNombre}`,
        idReporte: reportId,
        empleadosEvaluados: totalRespondents.toString(),
    };
}

function buildResumenEjecutivo(qualitativeResults, averages) {
    return {
        resumenGeneral: qualitativeResults.resumenEjecutivo,
        puntuacionGeneral: {
            puntuacion: parseFloat(scaleToTen(averages.overallAvg).toFixed(1))
        },
        puntuacionesDimensiones: [
            { nombre: "Madurez Digital", puntuacion: parseFloat(scaleToTen(averages.madurezDigitalAvg).toFixed(1)), color: "#F59E0B" },
            { nombre: "Competencias Digitales", puntuacion: parseFloat(scaleToTen(averages.brechaDigitalAvg).toFixed(1)), color: "#EF4444" },
            { nombre: "Uso de IA", puntuacion: parseFloat(scaleToTen(averages.usoInteligenciaArtificialAvg).toFixed(1)), color: "#8B5CF6" },
            { nombre: "Cultura Digital", puntuacion: parseFloat(scaleToTen(averages.culturaOrganizacionalAvg).toFixed(1)), color: "#10B981" }
        ],
        fortalezas: [], // TODO: Llenar con análisis de IA
        oportunidades: [], // TODO: Llenar con análisis de IA
    };
}

function buildBrechaDigital(empresaNombre, overallAvg, qualitativeResults) {
    const brechaTexts = qualitativeResults.brechaDigital || {};
    return {
        puntuacionEmpresa: parseFloat(scaleToTen(overallAvg).toFixed(1)),
        puntuacionMetaSector: 9.38, // TODO: Mover a config.js
        nombreEmpresa: empresaNombre,
        textoNivelActual: brechaTexts.textoNivelActual || "Análisis no disponible.",
        textoOportunidadParrafo: brechaTexts.textoOportunidadParrafo || "Análisis no disponible.",
        parrafo1: brechaTexts.parrafo1 || "Análisis no disponible.",
        parrafo2: brechaTexts.parrafo2 || "Análisis no disponible.",
    };
}

function buildMadurezDigital(empresaNombre, madurezDigitalAvg, analysisResults) {
    return {
        puntuacionGeneral: parseFloat(scaleToTen(madurezDigitalAvg).toFixed(1)),
        nombreEmpresa: empresaNombre,
        parrafoIntroductorio: "", // TODO: Llenar con análisis de IA
        componentes: Object.entries(analysisResults.madurezDigital).map(([key, value]) => ({
            nombre: formatDimensionName(key),
            puntuacion: parseFloat(scaleToTen(value).toFixed(1)),
            descripcion: `Puntuación de ${parseFloat(scaleToTen(value).toFixed(2))}/10 en ${formatDimensionName(key)}.`,
            color: "var(--color-company)",
            colorGradiente: "#4387ff",
            meta: 9.38 // TODO: Mover a config.js
        })),
    };
}

function buildCompetenciasDigitales(brechaDigitalAvg, analysisResults) {
    return {
        promedio: parseFloat(scaleToTen(brechaDigitalAvg).toFixed(1)),
        nivelDesarrollo: "", // TODO: Llenar con análisis de IA
        descripcionPromedio: "", // TODO: Llenar con análisis de IA
        competencias: Object.entries(analysisResults.brechaDigital).map(([key, value]) => ({
            name: formatDimensionName(key),
            score: Math.round((value / 4) * 100),
            color: '#3498db',
            description: `Nivel de desarrollo en ${formatDimensionName(key)}.`
        })),
    };
}

function buildUsoInteligenciaArtificial(analysisResults) {
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

    return {
        resumen: "", // TODO: Llenar con análisis de IA
        graficos: [
            {
                nombre: "Adopción y Curiosidad",
                porcentaje: Math.round((iaAdopcion / 4) * 100),
                descripcion: "" // TODO: Llenar con análisis de IA
            },
            {
                nombre: "Uso y Aplicación",
                porcentaje: Math.round((iaUso / 4) * 100),
                descripcion: "" // TODO: Llenar con análisis de IA
            },
            {
                nombre: "Ética y Verificación",
                porcentaje: Math.round((iaEtica / 4) * 100),
                descripcion: "" // TODO: Llenar con análisis de IA
            }
        ]
    };
}

function buildCulturaOrganizacional(analysisResults) {
    const culturaLiderazgo = calculateAverage([analysisResults.culturaOrganizacional.liderazgoYVision, analysisResults.culturaOrganizacional.reconocimiento]);
    const culturaFormacion = calculateAverage([analysisResults.culturaOrganizacional.ambienteDeAprendizaje, analysisResults.culturaOrganizacional.apoyoOrganizacional]);
    const culturaApertura = analysisResults.culturaOrganizacional.experimentacion;

    return {
        insights: {
            resumen: "" // TODO: Llenar con análisis de IA
        },
        tarjetas: [
            {
                titulo: "Apertura a la experimentación",
                puntuacion: parseFloat(scaleToTen(culturaApertura).toFixed(1)),
                fraseClave: "", // TODO: Llenar con análisis de IA
                narrativa: "" // TODO: Llenar con análisis de IA
            },
            {
                titulo: "Formación y Apoyo",
                puntuacion: parseFloat(scaleToTen(culturaFormacion).toFixed(1)),
                fraseClave: "", // TODO: Llenar con análisis de IA
                narrativa: "" // TODO: Llenar con análisis de IA
            },
            {
                titulo: "Liderazgo y Visión",
                puntuacion: parseFloat(scaleToTen(culturaLiderazgo).toFixed(1)),
                fraseClave: "", // TODO: Llenar con análisis de IA
                narrativa: "" // TODO: Llenar con análisis de IA
            }
        ]
    };
}

function buildRoleSpecificScores(analysisResults) {
    const scores = {};
    Object.keys(analysisResults)
        .filter(dim => dim.startsWith('rol'))
        .forEach(dim => {
            scores[dim] = {};
            for (const subDim in analysisResults[dim]) {
                scores[dim][subDim] = parseFloat(scaleToTen(analysisResults[dim][subDim]).toFixed(2));
            }
        });
    return scores;
}


// --- Orquestador Principal del Constructor de Reporte ---

/**
 * Construye el objeto JSON final del reporte a partir de los datos de análisis.
 * @param {Object} analysisResults - Resultados del análisis cuantitativo.
 * @param {Object} qualitativeResults - Resultados del análisis cualitativo (textos de IA).
 * @param {number} totalRespondents - Número total de encuestados.
 * @param {string} empresaNombre - Nombre de la empresa.
 * @param {string} reportId - ID del reporte.
 * @returns {Object} - El objeto JSON completo del reporte.
 */
export function generateReportJson(analysisResults, qualitativeResults, totalRespondents, empresaNombre, reportId) {
    const template = loadJson(TEMPLATE_PATH);

    // --- Cálculos de Puntuaciones Generales ---
    const averages = {
        madurezDigitalAvg: calculateAverage(Object.values(analysisResults.madurezDigital)),
        brechaDigitalAvg: calculateAverage(Object.values(analysisResults.brechaDigital)),
        usoInteligenciaArtificialAvg: calculateAverage(Object.values(analysisResults.usoInteligenciaArtificial)),
        culturaOrganizacionalAvg: calculateAverage(Object.values(analysisResults.culturaOrganizacional)),
    };
    averages.overallAvg = calculateAverage(Object.values(averages));

    // --- Ensamblaje del Reporte Final ---
    // Cada sección es construida por su propia función pura.
    template.header = buildHeader(empresaNombre, reportId, totalRespondents);
    template.resumenEjecutivo = buildResumenEjecutivo(qualitativeResults, averages);
    template.introduccion.contenido = qualitativeResults.introduccion; // Asignación directa
    template.brechaDigital = buildBrechaDigital(empresaNombre, averages.overallAvg, qualitativeResults);
    template.madurezDigital = buildMadurezDigital(empresaNombre, averages.madurezDigitalAvg, analysisResults);
    template.competenciasDigitales = buildCompetenciasDigitales(averages.brechaDigitalAvg, analysisResults);
    template.usoInteligenciaArtificial = buildUsoInteligenciaArtificial(analysisResults);
    template.culturaOrganizacional = buildCulturaOrganizacional(analysisResults);
    template.roleSpecificScores = buildRoleSpecificScores(analysisResults);
    
    // Plan de acción se mantiene como estático por ahora
    // template.planAccion = {};

    return template;
}