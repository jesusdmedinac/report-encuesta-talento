import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { scaleToTen } from '../utils.js';

/**
 * Inicializa y devuelve un cliente de IA basado en el proveedor especificado.
 * @param {string} provider - El proveedor de IA ('gemini' o 'openai').
 * @param {string} modelName - El nombre del modelo a utilizar.
 * @returns {Object} - Instancia del cliente de IA.
 */
export function initializeAiClient(provider, modelName) {
    let aiClient;
    let effectiveModelName;

    console.log(`Inicializando cliente de IA para el proveedor: ${provider}`);

    switch (provider) {
        case 'gemini':
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                throw new Error('La variable de entorno GEMINI_API_KEY no está configurada.');
            }
            effectiveModelName = modelName || 'gemini-1.5-flash';
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            aiClient = genAI.getGenerativeModel({ 
                model: effectiveModelName,
                generationConfig: { responseMimeType: "application/json" }
            });
            break;

        case 'openai':
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
                throw new Error('La variable de entorno OPENAI_API_KEY no está configurada.');
            }
            effectiveModelName = modelName || 'gpt-4o';
            aiClient = new OpenAI({ apiKey: openaiApiKey });
            break;

        default:
            throw new Error(`Proveedor de IA no soportado: ${provider}. Soportados: 'gemini', 'openai'.`);
    }

    console.log(`Cliente de IA inicializado con el modelo: ${effectiveModelName}.`);
    return { aiClient, effectiveModelName };
}

/**
 * Escala recursivamente todas las puntuaciones numéricas en un objeto.
 * @param {Object} data - El objeto con los resultados cuantitativos.
 * @returns {Object} - Un nuevo objeto con todas las puntuaciones escaladas a 10.
 */
function scaleScores(data) {
    const scaledData = {};
    for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
            scaledData[key] = scaleScores(data[key]);
        } else if (typeof data[key] === 'number') {
            // Redondea a 2 decimales para mayor claridad en el prompt
            scaledData[key] = parseFloat(scaleToTen(data[key]).toFixed(2));
        } else {
            scaledData[key] = data[key];
        }
    }
    return scaledData;
}


/**
 * Realiza el análisis cualitativo generando texto a través de una IA.
 * @param {string} provider - El proveedor de IA.
 * @param {Object} aiClient - La instancia del cliente de IA.
 * @param {string} modelName - El nombre del modelo.
 * @param {Object} quantitativeResults - Los resultados del análisis cuantitativo (escala 1-4).
 * @returns {Promise<Object>} - Una promesa que resuelve al objeto con los textos generados.
 */
export async function performQualitativeAnalysis(provider, aiClient, modelName, quantitativeResults) {
    console.log('Iniciando análisis cualitativo con IA...');

    // Escala los resultados a una base de 10 para la IA
    const scaledResults = scaleScores(quantitativeResults);

    const comprehensivePrompt = `
        Eres un consultor experto en transformación digital.
        Basado en los siguientes resultados cuantitativos de una encuesta de madurez digital,
        donde la puntuación ha sido escalada a una base de 1 a 10,
        genera un objeto JSON con ocho propiedades: "resumenEjecutivo", "introduccion", "brechaDigital", "madurezDigital", "competenciasDigitales", "usoInteligenciaArtificial", "culturaOrganizacional" y "planAccion".

        Resultados Cuantitativos (promedios en escala de 1 a 10):
        ${JSON.stringify(scaledResults, null, 2)}

        Instrucciones para el contenido del JSON:
        1.  **resumenEjecutivo**: Un objeto que contenga tres propiedades:
            - **resumenGeneral**: Un resumen conciso y profesional de 3 párrafos, escrito en un tono de experto a cliente, que resalte las áreas clave de fortaleza y debilidad sin usar un lenguaje demasiado técnico y finalice con una nota optimista.
            - **fortalezas**: Un ARRAY de 3 a 4 strings. Cada string debe ser una fortaleza clave identificada en los datos, idealmente incluyendo la puntuación relevante.
            - **oportunidades**: Un ARRAY de 3 a 4 strings. Cada string debe ser una oportunidad de mejora clara basada en los datos, idealmente incluyendo la puntuación relevante.
        2.  **introduccion**: Un párrafo de introducción para el reporte. Debe dar la bienvenida, mencionar el propósito del diagnóstico y establecer un tono positivo y constructivo para el resto del documento.
        3.  **brechaDigital**: Un objeto que contiene los textos para la sección de Brecha Digital. Basado en la puntuación general (overallAvg), genera los siguientes textos:
            - **textoNivelActual**: Una frase corta que describa el nivel actual de la empresa (ej. 'Nivel Competitivo', 'En Desarrollo', 'Líder del Sector').
            - **textoOportunidadParrafo**: Un párrafo que explique la oportunidad de crecimiento de la empresa en comparación con la meta del sector (puntuacionMetaSector: 9.38 sobre 10).
            - **parrafo1**: Un párrafo que analice el estado actual de la madurez digital de la empresa.
            - **parrafo2**: Un párrafo que describa los próximos pasos o el enfoque recomendado para cerrar la brecha digital.
        4.  **madurezDigital**: Un objeto para la sección de Madurez Digital. Basado en las puntuaciones de la sub-sección 'madurezDigital' en los resultados cuantitativos, genera lo siguiente:
            - **parrafoIntroductorio**: Un párrafo que analice la puntuación general de esta dimensión y su significado para la empresa.
            - **componentes**: Un ARRAY de objetos. Cada objeto debe tener dos propiedades: 'nombre' (el identificador del componente, ej. 'adaptabilidad') y 'descripcion' (un párrafo que analiza la puntuación específica de ese componente y sugiere áreas de enfoque).
        5.  **competenciasDigitales**: Un objeto para la sección de Competencias Digitales. Basado en las puntuaciones de la sub-sección 'brechaDigital' (que en realidad representa las competencias), genera lo siguiente:
            - **descripcionPromedio**: Un párrafo que analice la puntuación general de esta dimensión y su significado.
            - **nivelDesarrollo**: Una frase corta que describa el nivel de desarrollo (ej. 'FUNDAMENTOS ESTABLECIDOS', 'ETAPA INICIAL').
            - **competencias**: Un ARRAY de objetos. Cada objeto debe tener dos propiedades: 'name' (el identificador de la competencia, ej. 'agilidadDigital') y 'description' (un párrafo que analiza la puntuación específica de esa competencia y ofrece una recomendación o insight).
        6.  **usoInteligenciaArtificial**: Un objeto para la sección de Uso de IA. Basado en las puntuaciones de la sub-sección 'usoInteligenciaArtificial', genera lo siguiente:
            - **resumen**: Un párrafo que resuma el estado general de la empresa en cuanto a IA, destacando oportunidades estratégicas. Debe contener la etiqueta "<strong>" para resaltar la idea principal.
            - **graficos**: Un ARRAY de 3 objetos, uno para cada una de las siguientes agrupaciones (los títulos deben ser exactos):
                1.  **Adopción y Curiosidad**: Analiza las puntuaciones combinadas de 'interesEnAprendizaje', 'percepcionDeRiesgo' y 'nivelDeAdopcion'.
                2.  **Uso y Aplicación**: Analiza las puntuaciones combinadas de 'frecuenciaDeUso' y 'habilidadDeUso'.
                3.  **Ética y Verificación**: Analiza la puntuación de 'eticaYVerificacion'.
              Cada objeto del array debe tener una única propiedad: 'descripcion' (un párrafo que analice la puntuación del grupo y su implicación para la empresa).
        7.  **culturaOrganizacional**: Un objeto para la sección de Cultura Organizacional. Basado en las puntuaciones de la sub-sección 'culturaOrganizacional', genera lo siguiente:
            - **insights**: Un objeto que contenga:
                - **resumen**: Un párrafo que resuma el estado general de la cultura digital de la empresa.
                - **puntos**: Un ARRAY de 3 objetos. Cada objeto debe tener las propiedades 'icono' (un emoji relevante) y 'texto' (una frase corta con la puntuación, usando la etiqueta "<strong>" para el concepto clave).
            - **tarjetas**: Un ARRAY de 3 objetos, uno para cada una de las siguientes agrupaciones (los títulos deben ser exactos):
                1.  **Apertura a la experimentación**: Basado en la puntuación de 'experimentacion'.
                2.  **Formación y Apoyo**: Basado en las puntuaciones combinadas de 'ambienteDeAprendizaje' y 'apoyoOrganizacional'.
                3.  **Liderazgo y Visión**: Basado en las puntuaciones combinadas de 'liderazgoYVision' y 'reconocimiento'.
              Cada objeto de la tarjeta debe tener las siguientes propiedades generadas por la IA: 'etiquetaNivel' (ej. 'Primera etapa'), 'fraseClave' (una cita inspiradora sobre el estado actual) y 'narrativa' (un párrafo de análisis y recomendación).
        8.  **planAccion**: Un objeto detallado para el Plan de Acción. Basado en las puntuaciones más bajas y las oportunidades más claras de los datos, genera lo siguiente:
            - **resumenGeneral**: Un párrafo introductorio que establezca la visión estratégica del plan de acción.
            - **iniciativas**: Un ARRAY de 3 a 4 iniciativas. Cada iniciativa debe ser un objeto con las siguientes propiedades:
                - **id**: Un identificador único (ej. 'CD-001').
                - **titulo**: Un título claro y conciso para la iniciativa.
                - **descripcion**: Un párrafo que explique en qué consiste la iniciativa y por qué es importante.
                - **areaEnfoque**: El área principal que impacta (ej. 'Competencias Digitales', 'Cultura Organizacional').
                - **objetivosClave**: Un ARRAY de 3 a 4 strings que listen los resultados esperados.
                - **metricasExito**: Un ARRAY de 2 a 3 objetos, donde cada objeto tiene 'metrica' (el KPI a medir) y 'valorObjetivo' (el resultado deseado, ej. 'De 45% a 80%').
                - **responsableSugerido**: El rol o departamento que debería liderar la iniciativa.
                - **plazoEstimado**: El tiempo estimado para la implementación (ej. '3-6 meses').
                - **prioridad**: La prioridad de la iniciativa ('Alta', 'Media', o 'Baja').
    `;

    try {
        console.log('Generando textos cualitativos con datos escalados...');
        let generatedText = "";

        switch (provider) {
            case 'gemini':
                const geminiResult = await aiClient.generateContent(comprehensivePrompt);
                const geminiResponse = await geminiResult.response;
                generatedText = geminiResponse.text();
                break;

            case 'openai':
                const openAIResult = await aiClient.chat.completions.create({
                    model: modelName,
                    messages: [{ role: 'user', content: comprehensivePrompt }],
                    response_format: { type: "json_object" },
                });
                generatedText = openAIResult.choices[0].message.content;
                break;
        }

        const insights = JSON.parse(generatedText);
        console.log('Textos cualitativos generados y parseados correctamente.');
        return insights;

    } catch (error) {
        console.error(`Error al generar el análisis cualitativo con ${provider}:`, error);
        // Devuelve un objeto con valores por defecto en caso de error para no romper el resto del script
        return {
            resumenEjecutivo: `No se pudo generar el resumen ejecutivo con ${provider}.`,
            introduccion: `No se pudo generar la introducción con ${provider}.`
        };
    }
}
