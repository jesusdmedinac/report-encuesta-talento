import path from 'path';

// --- Rutas Principales ---
export const MAPPINGS_PATH = path.join(process.cwd(), 'src', 'scripts', 'mappings.json');
export const TEMPLATE_PATH = path.join(process.cwd(), 'src', 'data', 'globalData.json');

// --- Configuración de Columnas del CSV ---

// Columnas con información personal identificable a ser eliminadas.
export const PII_COLUMNS = [
    '#', 'DEMO_CONSENT: Política de privacidad de datos', 'DEMO_CONTACT: Nombre',
    'DEMO_CONTACT: Apellido', 'DEMO_CONTACT: Email', 'DEMO_PROFESSIONAL: Departamento:',
    'DEMO_PROFESSIONAL: Nivel de estudios:', 'DEMO_PROFESSIONAL: Menciona el rol que cumples en tu empresa:',
    'DEMO_PROFESSIONAL: Menciona cuáles son las tres principales responsabilidades o actividades que desempeñas en ese rol:',
    'DEMO_PROFESSIONAL: Other', 'DEMO_PROFESSIONAL: ¿Hacia qué posición, área o tipo de rol aspiras llegar en tu desarrollo profesional?',
    'DEMO_PROFESSIONAL: Género:', 'DEMO_PROFESSIONAL: Rango de Edad:'
];

// Mapeo de códigos de preguntas abiertas a su texto completo.
export const OPEN_ENDED_QUESTIONS = {
    'D1_OPEN': 'D1_OPEN: Si pudieras describir tu viaje de aprendizaje digital en una frase, ¿cuál sería?',
    'D2_OPEN': 'D2_OPEN: Pensando en las herramientas que usas a diario, ¿qué te ayudaría a ser más eficiente: una nueva herramienta, más capacitación en las actuales, o algo diferente?',
    'D3_OPEN': 'D3_OPEN: Desde tu perspectiva, ¿qué es lo más importante que la empresa podría hacer para acelerar nuestra cultura digital?',
    'D4_OPEN': 'D4_OPEN: Pensando en el futuro, ¿cuál es tu mayor expectativa o preocupación sobre el uso de la Inteligencia Artificial en tu rol?'
};

// Agrupa todas las columnas que no contienen datos cuantitativos.
export const ALL_NON_QUANTITATIVE_COLUMNS = [...PII_COLUMNS, ...Object.values(OPEN_ENDED_QUESTIONS)];

// --- Versionado y Gobernanza ---
export const SCHEMA_VERSION = '1.0.0';
export const PROMPT_VERSION = '1.0.0';

// --- Parámetros de Negocio y Presentación (centralización) ---
export const META_SECTOR_SCORE = 9.38;

export const COLORS = {
    company: 'var(--color-company)',
    componentGradient: '#4387ff',
    competenciasBar: '#3498db',
};

export const IA_CHARTS = {
    adoption: {
        id: 'gradient-adoption',
        colors: ['#10B981', '#34D399', '#6EE7B7'],
        title: 'Adopción y Curiosidad',
    },
    usage: {
        id: 'gradient-usage',
        colors: ['#F59E0B', '#FBBF24', '#FDE047'],
        title: 'Uso y Aplicación',
    },
    ethics: {
        id: 'gradient-ethics',
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
        title: 'Ética y Verificación',
    },
};

// --- Parámetros de configuración ampliados ---

// Umbrales de interpretación y niveles (ejemplo, ajustables por cliente/sector)
export const UMBRALES = {
    madurez: { bajo: 4.0, medio: 6.5, alto: 8.0 }, // escala 0-10
    competencias: { bajo: 40, medio: 70, alto: 85 }, // escala 0-100
};

// Pesos por dimensión (si se requieren promedios ponderados en el futuro)
export const PESOS = {
    madurezDigital: 1,
    brechaDigital: 1,
    usoInteligenciaArtificial: 1,
    culturaOrganizacional: 1,
};

// Límites para llamadas a IA / batching
export const LIMITES_IA = {
    preAnalisis: {
        maxCharsBatch: 10000,
        maxItemsBatch: 80,
    }
};

// Feature flags para habilitar/deshabilitar funcionalidades
export const FEATURE_FLAGS = {
    enableOpenEndedPreanalysis: true,
};

// Metas/targets por dimensión en escala 1–10 (ajustables por cliente/sector)
export const TARGETS_10 = {
    madurezDigital: 8.0,
    brechaDigital: 8.0,
    usoInteligenciaArtificial: 8.0,
    culturaOrganizacional: 8.0,
};

// Pesos/umbrales del plan de acción individual (selector determinista)
export const ACTION_PLAN_WEIGHTS = {
    minGap: 0.05,
    roleBonus: 0.4,
    signalsBonus: 0.2,
    subsBonus: 0.3,
    impactHigh: 0.2,
    impactMedium: 0.1,
    effortHighPenalty: -0.2,
    effortLowBonus: 0.1,
    kpiMinIncrement: 0.5,
};

// Peso relativo por dimensión para priorización (>= 1 favorece, < 1 de-prioriza)
export const ACTION_DIM_WEIGHTS = {
    madurezDigital: 1.0,
    brechaDigital: 1.0,
    usoInteligenciaArtificial: 1.2,
    culturaOrganizacional: 0.9,
};
