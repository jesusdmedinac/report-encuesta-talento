import { TEMPLATE_PATH } from '../config.js';
import { loadJson, calculateAverage, scaleToTen, formatDimensionName } from '../utils.js';

// --- Funciones "Constructoras" por Sección ---

function buildHeader(empresaNombre, reportId, totalRespondents, provider, model) {
    const hoy = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return {
        empresa: empresaNombre,
        fechaDiagnostico: hoy.toLocaleDateString('es-ES', opcionesFecha),
        titulo: `Reporte de Transformación Digital para ${empresaNombre}`,
        idReporte: reportId,
        empleadosEvaluados: totalRespondents.toString(),
        provider: provider,
        model: model,
    };
}

function buildResumenEjecutivo(qualitativeResults, averages) {
    const resumenAI = qualitativeResults.resumenEjecutivo || {};
    return {
        resumenGeneral: resumenAI.resumenGeneral || "Análisis no disponible.",
        puntuacionGeneral: {
            puntuacion: parseFloat(scaleToTen(averages.overallAvg).toFixed(1))
        },
        puntuacionesDimensiones: [
            { nombre: "Madurez Digital", puntuacion: parseFloat(scaleToTen(averages.madurezDigitalAvg).toFixed(1)), color: "#F59E0B" },
            { nombre: "Competencias Digitales", puntuacion: parseFloat(scaleToTen(averages.brechaDigitalAvg).toFixed(1)), color: "#EF4444" },
            { nombre: "Uso de IA", puntuacion: parseFloat(scaleToTen(averages.usoInteligenciaArtificialAvg).toFixed(1)), color: "#8B5CF6" },
            { nombre: "Cultura Digital", puntuacion: parseFloat(scaleToTen(averages.culturaOrganizacionalAvg).toFixed(1)), color: "#10B981" }
        ],
        fortalezas: resumenAI.fortalezas || [],
        oportunidades: resumenAI.oportunidades || [],
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

function buildMadurezDigital(empresaNombre, madurezDigitalAvg, analysisResults, qualitativeResults) {
    const madurezTexts = qualitativeResults.madurezDigital || {};
    const componentesAI = madurezTexts.componentes || [];
    
    const descripcionMap = new Map();
    if (Array.isArray(componentesAI)) {
        componentesAI.forEach(c => {
            const normalizedName = c.nombre.replace(/\s+/g, '');
            descripcionMap.set(normalizedName.toLowerCase(), c.descripcion);
        });
    }

    return {
        puntuacionGeneral: parseFloat(scaleToTen(madurezDigitalAvg).toFixed(1)),
        nombreEmpresa: empresaNombre,
        parrafoIntroductorio: madurezTexts.parrafoIntroductorio || "Análisis no disponible.",
        componentes: Object.entries(analysisResults.madurezDigital).map(([key, value]) => {
            const descripcionIA = descripcionMap.get(key.toLowerCase());
            return {
                nombre: formatDimensionName(key),
                puntuacion: parseFloat(scaleToTen(value).toFixed(1)),
                descripcion: descripcionIA || `Puntuación de ${parseFloat(scaleToTen(value).toFixed(2))}/10 en ${formatDimensionName(key)}.`,
                color: "var(--color-company)",
                colorGradiente: "#4387ff",
                meta: 9.38 // TODO: Mover a config.js
            };
        }),
    };
}

function buildCompetenciasDigitales(brechaDigitalAvg, analysisResults, qualitativeResults) {
    const competenciasTexts = qualitativeResults.competenciasDigitales || {};
    const competenciasAI = competenciasTexts.competencias || [];

    const descripcionMap = new Map();
    if (Array.isArray(competenciasAI)) {
        competenciasAI.forEach(c => {
            const normalizedName = c.name.replace(/\s+/g, '');
            descripcionMap.set(normalizedName.toLowerCase(), c.description);
        });
    }

    return {
        promedio: parseFloat(scaleToTen(brechaDigitalAvg).toFixed(1)),
        nivelDesarrollo: competenciasTexts.nivelDesarrollo || "Análisis no disponible.",
        descripcionPromedio: competenciasTexts.descripcionPromedio || "Análisis no disponible.",
        competencias: Object.entries(analysisResults.brechaDigital).map(([key, value]) => {
            const descripcionIA = descripcionMap.get(key.toLowerCase());
            return {
                name: formatDimensionName(key),
                score: Math.round((value / 4) * 100),
                color: '#3498db',
                description: descripcionIA || `Nivel de desarrollo en ${formatDimensionName(key)}.`
            };
        }),
    };
}

function buildUsoInteligenciaArtificial(analysisResults, qualitativeResults) {
    const iaTexts = qualitativeResults.usoInteligenciaArtificial || {};
    const graficosAI = iaTexts.graficos || [];

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
        resumen: iaTexts.resumen || "Análisis no disponible.",
        graficos: [
            { titulo: "Adopción y Curiosidad", porcentaje: Math.round((iaAdopcion / 4) * 100), descripcion: graficosAI[0]?.descripcion || "Análisis no disponible.", idGradiente: "gradient-adoption", coloresGradiente: ["#10B981", "#34D399", "#6EE7B7"] },
            { titulo: "Uso y Aplicación", porcentaje: Math.round((iaUso / 4) * 100), descripcion: graficosAI[1]?.descripcion || "Análisis no disponible.", idGradiente: "gradient-usage", coloresGradiente: ["#F59E0B", "#FBBF24", "#FDE047"] },
            { titulo: "Ética y Verificación", porcentaje: Math.round((iaEtica / 4) * 100), descripcion: graficosAI[2]?.descripcion || "Análisis no disponible.", idGradiente: "gradient-ethics", coloresGradiente: ["#8B5CF6", "#A78BFA", "#C4B5FD"] }
        ]
    };
}

function buildCulturaOrganizacional(analysisResults, qualitativeResults) {
    const culturaTexts = qualitativeResults.culturaOrganizacional || {};
    const insightsAI = culturaTexts.insights || {};
    const tarjetasAI = culturaTexts.tarjetas || [];

    const culturaLiderazgo = calculateAverage([analysisResults.culturaOrganizacional.liderazgoYVision, analysisResults.culturaOrganizacional.reconocimiento]);
    const culturaFormacion = calculateAverage([analysisResults.culturaOrganizacional.ambienteDeAprendizaje, analysisResults.culturaOrganizacional.apoyoOrganizacional]);
    const culturaApertura = analysisResults.culturaOrganizacional.experimentacion;

    const aiDataMap = {
        'Apertura a la experimentación': tarjetasAI[0] || {},
        'Formación y Apoyo': tarjetasAI[1] || {},
        'Liderazgo y Visión': tarjetasAI[2] || {},
    };

    return {
        insights: { resumen: insightsAI.resumen || "Análisis no disponible.", puntos: insightsAI.puntos || [] },
        tarjetas: [
            { titulo: "Apertura a la experimentación", puntuacion: parseFloat(scaleToTen(culturaApertura).toFixed(1)), fraseClave: aiDataMap['Apertura a la experimentación'].fraseClave || "", narrativa: aiDataMap['Apertura a la experimentación'].narrativa || "Análisis no disponible.", etiquetaNivel: aiDataMap['Apertura a la experimentación'].etiquetaNivel || "", metricas: [], colorIcono: "", icono: "" },
            { titulo: "Formación y Apoyo", puntuacion: parseFloat(scaleToTen(culturaFormacion).toFixed(1)), fraseClave: aiDataMap['Formación y Apoyo'].fraseClave || "", narrativa: aiDataMap['Formación y Apoyo'].narrativa || "Análisis no disponible.", etiquetaNivel: aiDataMap['Formación y Apoyo'].etiquetaNivel || "", metricas: [], colorIcono: "", icono: "" },
            { titulo: "Liderazgo y Visión", puntuacion: parseFloat(scaleToTen(culturaLiderazgo).toFixed(1)), fraseClave: aiDataMap['Liderazgo y Visión'].fraseClave || "", narrativa: aiDataMap['Liderazgo y Visión'].narrativa || "Análisis no disponible.", etiquetaNivel: aiDataMap['Liderazgo y Visión'].etiquetaNivel || "", metricas: [], colorIcono: "", icono: "" }
        ]
    };
}

function buildPlanAccion(qualitativeResults) {
    return qualitativeResults.planAccion || {
        resumenGeneral: "El análisis del plan de acción no está disponible.",
        iniciativas: []
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

export function generateReportJson(analysisResults, qualitativeResults, totalRespondents, empresaNombre, reportId, provider, model) {
    const template = loadJson(TEMPLATE_PATH);

    const averages = {
        madurezDigitalAvg: calculateAverage(Object.values(analysisResults.madurezDigital)),
        brechaDigitalAvg: calculateAverage(Object.values(analysisResults.brechaDigital)),
        usoInteligenciaArtificialAvg: calculateAverage(Object.values(analysisResults.usoInteligenciaArtificial)),
        culturaOrganizacionalAvg: calculateAverage(Object.values(analysisResults.culturaOrganizacional)),
    };
    averages.overallAvg = calculateAverage(Object.values(averages));

    template.header = buildHeader(empresaNombre, reportId, totalRespondents, provider, model);
    template.resumenEjecutivo = buildResumenEjecutivo(qualitativeResults, averages);
    template.introduccion.contenido = qualitativeResults.introduccion;
    template.brechaDigital = buildBrechaDigital(empresaNombre, averages.overallAvg, qualitativeResults);
    template.madurezDigital = buildMadurezDigital(empresaNombre, averages.madurezDigitalAvg, analysisResults, qualitativeResults);
    template.competenciasDigitales = buildCompetenciasDigitales(averages.brechaDigitalAvg, analysisResults, qualitativeResults);
    template.usoInteligenciaArtificial = buildUsoInteligenciaArtificial(analysisResults, qualitativeResults);
    template.culturaOrganizacional = buildCulturaOrganizacional(analysisResults, qualitativeResults);
    template.planAccion = buildPlanAccion(qualitativeResults);
    template.roleSpecificScores = buildRoleSpecificScores(analysisResults);

    return template;
}
