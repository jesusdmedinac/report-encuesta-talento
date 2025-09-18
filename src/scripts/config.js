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
