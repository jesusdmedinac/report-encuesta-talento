import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

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
 * Realiza el análisis cualitativo generando texto a través de una IA.
 * @param {string} provider - El proveedor de IA.
 * @param {Object} aiClient - La instancia del cliente de IA.
 * @param {string} modelName - El nombre del modelo.
 * @param {Object} quantitativeResults - Los resultados del análisis cuantitativo.
 * @returns {Promise<Object>} - Una promesa que resuelve al objeto con los textos generados.
 */
export async function performQualitativeAnalysis(provider, aiClient, modelName, quantitativeResults) {
    console.log('Iniciando análisis cualitativo con IA...');

    const comprehensivePrompt = `
        Eres un consultor experto en transformación digital.
        Basado en los siguientes resultados cuantitativos de una encuesta de madurez digital,
        donde la puntuación va de 1 (muy en desacuerdo) a 4 (muy de acuerdo),
        genera un objeto JSON con dos propiedades: "resumenEjecutivo" e "introduccion".

        Resultados Cuantitativos (promedios de 1 a 4):
        ${JSON.stringify(quantitativeResults, null, 2)}

        Instrucciones para el contenido del JSON:
        1.  **resumenEjecutivo**: Un resumen conciso y profesional de 3 párrafos. Debe ser accionable, escrito en un tono de experto a cliente, y resaltar las áreas clave de fortaleza y debilidad sin usar un lenguaje demasiado técnico. Finaliza con una nota optimista sobre el potencial de mejora.
        2.  **introduccion**: Un párrafo de introducción para el reporte. Debe dar la bienvenida, mencionar el propósito del diagnóstico y establecer un tono positivo y constructivo para el resto del documento.
        3.  **brechaDigital**: Un objeto que contiene los textos para la sección de Brecha Digital. Basado en la puntuación general (overallAvg), genera los siguientes textos:
            - **textoNivelActual**: Una frase corta que describa el nivel actual de la empresa (ej. 'Nivel Competitivo', 'En Desarrollo', 'Líder del Sector').
            - **textoOportunidadParrafo**: Un párrafo que explique la oportunidad de crecimiento de la empresa en comparación con la meta del sector (puntuacionMetaSector: 9.38 sobre 10).
            - **parrafo1**: Un párrafo que analice el estado actual de la madurez digital de la empresa.
            - **parrafo2**: Un párrafo que describa los próximos pasos o el enfoque recomendado para cerrar la brecha digital.
    `;

    try {
        console.log('Generando textos cualitativos (resumen e introducción)...');
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
