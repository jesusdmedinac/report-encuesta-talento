import { validateData } from './validator.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { scaleToTen } from '../utils.js';
import { IA_CHARTS, LIMITES_IA } from '../config.js';

// --- Utilidades de reintento ---
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function isRetryableError(err) {
    const msg = String(err && (err.message || err.statusText || err)).toLowerCase();
    const code = err && (err.status || err.code);
    return (
        code === 429 || code === 503 ||
        msg.includes('overloaded') ||
        msg.includes('unavailable') ||
        msg.includes('rate limit') ||
        msg.includes('timeout') ||
        msg.includes('fetch failed')
    );
}
async function withRetries(fn, { attempts = Number(process.env.AI_MAX_RETRIES || 3), baseDelayMs = Number(process.env.AI_RETRY_BASE_MS || 800) } = {}) {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
        try { return await fn(); } catch (e) {
            lastErr = e;
            if (i === attempts || !isRetryableError(e)) break;
            const delay = baseDelayMs * Math.pow(2, i - 1);
            console.warn(`IA intento ${i}/${attempts} falló (${e.message || e}). Reintentando en ${delay}ms...`);
            await sleep(delay);
        }
    }
    throw lastErr;
}

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
            effectiveModelName = modelName || 'gemini-2.5-pro';
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
            effectiveModelName = modelName || 'gpt-5';
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
export async function performQualitativeAnalysis(provider, aiClient, modelName, quantitativeResults, openEndedData) {
    console.log('Iniciando análisis cualitativo con IA...');

    // Escala los resultados a una base de 10 para la IA
    const scaledResults = scaleScores(quantitativeResults);

    // Pre-análisis de preguntas abiertas si existen datos
    let analisisCualitativo = undefined;
    try {
        if (openEndedData && openEndedData.preguntas) {
            // Ya viene pre-analizado desde caché/externo
            analisisCualitativo = openEndedData;
        } else if (openEndedData && Object.values(openEndedData).some(arr => Array.isArray(arr) && arr.length)) {
            analisisCualitativo = await preAnalyzeOpenEnded(provider, aiClient, modelName, openEndedData);
            console.log('Pre-análisis cualitativo completado.');
        }
    } catch (e) {
        console.warn('Pre-análisis cualitativo falló, se continúa sin analisisCualitativo:', e.message);
    }

    const comprehensivePrompt = `
        Eres un consultor experto en transformación digital.
        Basado en los siguientes resultados cuantitativos de una encuesta de madurez digital,
        donde la puntuación ha sido escalada a una base de 1 a 10,
        genera un objeto JSON con ocho propiedades: "resumenEjecutivo", "introduccion", "brechaDigital", "madurezDigital", "competenciasDigitales", "usoInteligenciaArtificial", "culturaOrganizacional" y "planAccion".

        Resultados Cuantitativos (promedios en escala de 1 a 10):
        ${JSON.stringify(scaledResults, null, 2)}

        ${analisisCualitativo ? `\nInsights Cualitativos resumidos de respuestas abiertas:\n${JSON.stringify(analisisCualitativo, null, 2)}\n` : ''}

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

    let generationMode = 'online';
    try {
        console.log('Generando textos cualitativos con datos escalados...');
        let generatedText = "";

        // Timestamp para archivos de depuración
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');

        switch (provider) {
            case 'gemini': {
                generatedText = await withRetries(async () => {
                    const geminiResult = await aiClient.generateContent(comprehensivePrompt);
                    const geminiResponse = await geminiResult.response;
                    return geminiResponse.text();
                });
                break;
            }
            case 'openai': {
                generatedText = await withRetries(async () => {
                    const openAIResult = await aiClient.chat.completions.create({
                        model: modelName,
                        messages: [{ role: 'user', content: comprehensivePrompt }],
                        response_format: { type: "json_object" },
                    });
                    return openAIResult.choices[0].message.content || '';
                });
                break;
            }
        }

        // Observabilidad: persistir respuesta cruda en modo debug
        const DEBUG_AI = process.env.DEBUG_AI === '1' || process.env.DEBUG_AI === 'true';
        const truncatedPreview = (generatedText || '').slice(0, 180);
        console.log(`Respuesta IA recibida (${generatedText.length} chars). Preview: ${truncatedPreview.replace(/\n/g, ' ')}...`);

        if (DEBUG_AI) {
            try {
                const dbgDir = path.join(process.cwd(), 'debug');
                if (!fs.existsSync(dbgDir)) fs.mkdirSync(dbgDir, { recursive: true });
                const dbgPath = path.join(dbgDir, `ai-response.${provider}.${stamp}.json.txt`);
                fs.writeFileSync(dbgPath, generatedText, 'utf8');
                console.log(`DEBUG_AI: respuesta cruda guardada en ${dbgPath}`);
            } catch (e) {
                console.warn('No se pudo guardar la respuesta cruda de IA:', e.message);
            }
        }

        // Intento de reparación si el JSON viene con fences u otros adornos
        const repaired = sanitizeJsonLike(generatedText);
        try {
            const insights = JSON.parse(repaired);
            // Validar contra el esquema de respuesta de IA
            try {
                validateData(insights, 'ai-response');
            } catch (ve) {
                generationMode = 'online-degraded';
                console.warn('Validación de AIResponse falló. Se usará degradación con placeholders. Motivo:', ve.message);
                // Guardar artefactos de error para depuración
                try {
                    const dbgDir = path.join(process.cwd(), 'debug');
                    if (!fs.existsSync(dbgDir)) fs.mkdirSync(dbgDir, { recursive: true });
                    const base = path.join(dbgDir, `ai-response.failed.${provider}.${stamp}`);
                    fs.writeFileSync(base + '.raw.txt', generatedText, 'utf8');
                    fs.writeFileSync(base + '.sanitized.json', repaired, 'utf8');
                    fs.writeFileSync(base + '.error.txt', String(ve && ve.message || ve), 'utf8');
                    console.log(`Artefactos de depuración guardados en ${base}.*`);
                } catch (e) {
                    console.warn('No se pudieron guardar artefactos de depuración de validación:', e.message);
                }
                return buildAiFallback(analisisCualitativo);
            }
            console.log('Textos cualitativos generados, parseados y validados.');
            if (analisisCualitativo) {
                insights.analisisCualitativo = analisisCualitativo;
            }
            insights.__generationMode = generationMode;
            return insights;
        } catch (parseErr) {
            generationMode = 'online-degraded';
            console.error('Fallo al parsear JSON de IA tras reparación. Mensaje:', parseErr.message);
            // Guardar artefactos de error para depuración
            try {
                const dbgDir = path.join(process.cwd(), 'debug');
                if (!fs.existsSync(dbgDir)) fs.mkdirSync(dbgDir, { recursive: true });
                const base = path.join(dbgDir, `ai-response.parse-failed.${provider}.${stamp}`);
                fs.writeFileSync(base + '.raw.txt', generatedText || '', 'utf8');
                fs.writeFileSync(base + '.sanitized.json', repaired || '', 'utf8');
                fs.writeFileSync(base + '.error.txt', String(parseErr && parseErr.message || parseErr), 'utf8');
                console.log(`Artefactos de depuración guardados en ${base}.*`);
            } catch (e) {
                console.warn('No se pudieron guardar artefactos de depuración de parseo:', e.message);
            }
            const fb = buildAiFallback(analisisCualitativo);
            fb.__generationMode = generationMode;
            return fb;
        }

    } catch (error) {
        generationMode = 'online-degraded';
        console.error(`Error al generar el análisis cualitativo con ${provider}:`, error);
        const fb = buildAiFallback(null);
        fb.__generationMode = generationMode;
        if (analisisCualitativo) fb.analisisCualitativo = analisisCualitativo;
        return fb;
    }
}

// --- Utilidades de reparación/normalización de JSON ---
function sanitizeJsonLike(text) {
    if (!text) return text;
    let t = String(text).trim();
    // Eliminar fences tipo ```json ... ```
    if (t.startsWith('```')) {
        t = t.replace(/^```json/i, '').replace(/^```/, '').replace(/```\s*$/m, '').trim();
    }
    // Quedarse con el contenido entre la primera llave y la última
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        t = t.slice(start, end + 1);
    }
    return t;
}

// Construye un objeto fallback que cumple con el esquema ai-response
function buildAiFallback(analisisCualitativo) {
    const obj = {
        resumenEjecutivo: { resumenGeneral: 'Análisis no disponible.', fortalezas: [], oportunidades: [] },
        introduccion: 'Análisis no disponible.',
        brechaDigital: { textoNivelActual: 'Análisis no disponible.', textoOportunidadParrafo: 'Análisis no disponible.', parrafo1: 'Análisis no disponible.', parrafo2: 'Análisis no disponible.' },
        madurezDigital: { parrafoIntroductorio: 'Análisis no disponible.', componentes: [] },
        competenciasDigitales: { nivelDesarrollo: 'Análisis no disponible.', descripcionPromedio: 'Análisis no disponible.', competencias: [] },
        usoInteligenciaArtificial: { resumen: 'Análisis no disponible.', graficos: [{ descripcion: 'Análisis no disponible.' }, { descripcion: 'Análisis no disponible.' }, { descripcion: 'Análisis no disponible.' }] },
        culturaOrganizacional: { insights: { resumen: 'Análisis no disponible.', puntos: [] }, tarjetas: [{ narrativa: 'Análisis no disponible.' }, { narrativa: 'Análisis no disponible.' }, { narrativa: 'Análisis no disponible.' }] },
        planAccion: { resumenGeneral: 'Análisis no disponible.', iniciativas: [] },
    };
    if (analisisCualitativo) obj.analisisCualitativo = analisisCualitativo;
    return obj;
}

// --- Pre-análisis por lotes de preguntas abiertas ---
export async function preAnalyzeOpenEnded(provider, aiClient, modelName, openEndedData) {
    const result = { preguntas: {}, resumenGeneral: '', metricaSentimiento: 'neutral' };
    for (const [code, responses] of Object.entries(openEndedData)) {
        if (!Array.isArray(responses) || responses.length === 0) continue;
        const batches = batchStrings(
            responses,
            LIMITES_IA?.preAnalisis?.maxCharsBatch ?? 10000,
            LIMITES_IA?.preAnalisis?.maxItemsBatch ?? 80
        );
        const partials = [];
        for (const batch of batches) {
            const prompt = buildOpenEndedPrompt(code, batch);
            const jsonText = await callJson(provider, aiClient, modelName, prompt);
            const repaired = sanitizeJsonLike(jsonText);
            try {
                const parsed = JSON.parse(repaired);
                partials.push(parsed);
            } catch (e) {
                console.warn(`No se pudo parsear batch de ${code}:`, e.message);
            }
        }
        result.preguntas[code] = mergeThemePartials(partials);
    }
    // Resumen general básico a partir de etiquetas
    try {
        const labels = Object.values(result.preguntas)
            .flatMap(q => (q.temas || []).map(t => t.etiqueta))
            .filter(Boolean);
        if (labels.length) {
            const uniq = Array.from(new Set(labels)).slice(0, 8).join(', ');
            result.resumenGeneral = `Temas recurrentes: ${uniq}.`;
        }
    } catch {}
    return result;
}

function batchStrings(items, maxChars = 10000, maxItems = 80) {
    const batches = [];
    let current = [];
    let chars = 0;
    for (const s of items) {
        const c = s.length + 1;
        if (current.length && (chars + c > maxChars || current.length >= maxItems)) {
            batches.push(current);
            current = [];
            chars = 0;
        }
        current.push(s);
        chars += c;
    }
    if (current.length) batches.push(current);
    return batches;
}

function buildOpenEndedPrompt(code, responsesBatch) {
    return `Eres un analista de insights cualitativos.
Analiza las siguientes respuestas (anonimizadas) a la pregunta ${code}.
Devuelve SOLO JSON con la forma: {"temas":[{"id":"T-001","etiqueta":"...","palabrasClave":["..."],"conteo":12,"sentimiento":"positivo|neutral|negativo","citas":["..."]}],"resumenGeneral":"...","metricaSentimiento":"positivo|neutral|negativo"}
Respuestas:
${JSON.stringify(responsesBatch, null, 2)}
`;
}

async function callJson(provider, aiClient, modelName, prompt) {
    switch (provider) {
        case 'gemini': {
            const res = await aiClient.generateContent(prompt);
            const r = await res.response;
            return r.text();
        }
        case 'openai': {
            const res = await aiClient.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });
            return res.choices[0].message.content || '';
        }
        default:
            throw new Error(`Proveedor no soportado: ${provider}`);
    }
}

function mergeThemePartials(partials) {
    const out = { temas: [], resumenGeneral: '', metricaSentimiento: 'neutral' };
    const map = new Map();
    let sentiments = [];
    for (const p of partials) {
        const temas = Array.isArray(p.temas) ? p.temas : [];
        for (const t of temas) {
            const key = String(t.etiqueta || t.id || '').toLowerCase().trim();
            if (!key) continue;
            if (!map.has(key)) map.set(key, { id: t.id || `T-${map.size+1}`, etiqueta: t.etiqueta || key, palabrasClave: new Set(), conteo: 0, sentimiento: 'neutral', citas: [] });
            const agg = map.get(key);
            agg.conteo += Number(t.conteo || 0);
            (t.palabrasClave || []).forEach(k => agg.palabrasClave.add(String(k)));
            if (Array.isArray(t.citas)) {
                for (const c of t.citas) {
                    if (agg.citas.length < 3) agg.citas.push(String(c));
                }
            }
        }
        if (p.metricaSentimiento) sentiments.push(p.metricaSentimiento);
        if (p.resumenGeneral && !out.resumenGeneral) out.resumenGeneral = p.resumenGeneral;
    }
    out.temas = Array.from(map.values()).map(x => ({ ...x, palabrasClave: Array.from(x.palabrasClave) }));
    if (!out.resumenGeneral && out.temas.length) {
        const labs = out.temas.slice(0, 6).map(t => t.etiqueta).join(', ');
        out.resumenGeneral = `Temas más frecuentes: ${labs}.`;
    }
    out.metricaSentimiento = majoritySentiment(sentiments);
    return out;
}

function majoritySentiment(arr) {
    const counts = { positivo: 0, neutral: 0, negativo: 0 };
    for (const s of arr) {
        const k = (String(s).toLowerCase());
        if (counts[k] !== undefined) counts[k] += 1;
    }
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    return entries[0][0];
}
