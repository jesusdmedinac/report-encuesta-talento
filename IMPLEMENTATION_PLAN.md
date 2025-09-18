# Plan de Implementación: Generador Automático de Reportes de Madurez Digital

Este documento detalla el plan por fases para implementar el algoritmo de generación de reportes dentro del proyecto Astro actual. El objetivo es crear un script que procese un archivo CSV de respuestas, realice análisis cuantitativos y cualitativos (usando IA), y genere el archivo `src/data/globalData.json` que alimenta el frontend del reporte.

## Fase 1: Configuración del Entorno y Carga de Datos [COMPLETADO]

...

## Fase 2: Implementación del Módulo de Análisis Cuantitativo [COMPLETADO]

...

## Fase 3: Refactorización y Modularización (SOLID, DRY, SoC) [COMPLETADO]

Antes de expandir la generación de narrativas, se realizó una fase de refactorización para mejorar la calidad, mantenibilidad y escalabilidad del script.

1.  **Aplicar Principio de Responsabilidad Única (SRP):**
    *   El script monolítico se descompuso en módulos con responsabilidades claras: `config`, `utils`, `csv-processor`, `ai-analyzer`, y `report-builder`.

2.  **Aplicar Principio DRY (Don't Repeat Yourself):**
    *   Se crearon funciones de utilidad (ej. `formatDimensionName`) para centralizar lógica repetida.

3.  **Implementar Funciones Puras en el `report-builder`:**
    *   La función `generateReportJson` se descompuso en funciones "constructoras" (`build...`) más pequeñas y puras, mejorando la predictibilidad y facilidad para realizar pruebas.

## Fase 4: Generación Comprensiva de Narrativas por IA (Intérprete de IA)

En esta fase, integraremos un modelo de lenguaje grande (LLM) para generar **todas** las narrativas y análisis de texto del reporte. Se divide en dos sub-procesos: el análisis de respuestas abiertas y la generación de las narrativas principales.

### 4.1. Análisis de Respuestas Abiertas y Creación de Insights

Este es un paso nuevo y crucial para enriquecer el reporte con la voz directa de los empleados.

-   [x] Extracción cualitativa en `csv-processor.js`: agrupar columnas libres (ej. `D1_OPEN`), limpiar, anonimizar y deduplicar.
-   [x] Pre-análisis en `ai-analyzer.js`: batching/resumen por lotes con control de tokens y fusión de resultados.
-   [x] Objeto `analisisCualitativo`: `temas` [{ id, etiqueta, palabrasClave, conteo, sentimiento, citas }], `resumenGeneral`, `metricaSentimiento`.
-   [x] Componente `src/components/AnalisisCualitativo.astro` para visualizar temas, sentimiento y citas.
    
    Mejora de resiliencia:
    -   [x] Fallback offline en `generate-open-ended.mjs`: cuando la IA no está disponible, se generan temas/citas a partir de frecuencia de términos para no bloquear el flujo.

### 4.2. Generación de Narrativas Principales

-   [x] Estrategia de único prompt con JSON para generar las narrativas principales.
-   [x] Inyección de contexto cuantitativo y cualitativo (depende de 4.1) en el prompt principal.
-   [x] Esquema del JSON de IA ampliado: `resumenEjecutivo` con `fortalezas`/`oportunidades`, `introduccion`, `brechaDigital`, `planAccion` detallado.
-   [x] Integración de resultados en `report-builder.js` y frontend:
    -   [x] Reescritura de `src/components/PlanAccion.astro`.
    -   [x] Refactor de `src/components/ResumenEjecutivo.astro` (sin datos estáticos).
    -   [x] Integración de `src/components/AnalisisCualitativo.astro` en la página principal.

## Fase 5: Ensamblaje Final y Generación del Archivo [COMPLETADO]

Esta es la última fase del script, donde se une todo y se produce el archivo final.

1.  **Unir Datos Cuantitativos y Cualitativos: [COMPLETADO]**
    *   El orquestador principal (`generate-report.mjs`) une los resultados de `performQuantitativeAnalysis` y `performQualitativeAnalysis`.

2.  **Generar el JSON Final: [COMPLETADO]**
    *   El script escribe el objeto de datos completo en el archivo `src/data/globalData.[provider].json`.

3.  **Validación (Opcional pero Recomendado):**
    *   Considera crear un esquema JSON (schema) que defina la estructura de `globalData.json`.
    *   Añade un paso de validación en el script para asegurar que el JSON generado cumple con el esquema antes de guardarlo.
    *   Nota: por ahora `header.generatedAt` valida como `string` (sin `date-time`), a la espera de integrar `ajv-formats`.

## Fase 6: Integración y Documentación [COMPLETADO]

Para finalizar, haremos que el script sea fácil de usar y documentaremos su funcionamiento.

1.  **Crear Comando en `package.json`: [COMPLETADO]**
    *   Añade un nuevo script en la sección `"scripts"` de tu `package.json`.

2.  **Actualizar `README.md`: [COMPLETADO]**
    *   Añade una nueva sección al `README.md` del proyecto.
    *   Explica cómo ejecutar el nuevo script, incluyendo cómo pasar la ruta al archivo CSV de entrada.
    *   Documenta las variables de entorno necesarias (como la `API_KEY` para el servicio de IA).

## Fase 7: Validación, Tipado, Configuración y Observabilidad

-   [x] Esquemas y validación: validar con `ajv` + `ajv-formats` la salida de IA (`AIResponse`) y el `Report` final. Tolerancia en `insights.puntos` (string u objeto `{icono, texto}`).
-   [ ] Contratos de datos: añadir tipos compartidos (TS/JSDoc) para alinear `ai-analyzer`, `report-builder` y componentes Astro.
-   [x] Configuración centralizada: `config.js` con `UMBRALES`, `PESOS`, `LIMITES_IA`, `FEATURE_FLAGS`. Pendiente: overrides por sector/cliente/entorno.
-   [x] Trazabilidad: `header` con `schemaVersion`, `promptVersion`, `provider`, `model`, `generatedAt`, `generationMode`. Artefactos de depuración en `./debug/` y reintentos IA configurables (`AI_MAX_RETRIES`, `AI_RETRY_BASE_MS`).
-   [x] Pruebas mínimas: unit tests y snapshots del JSON final. Pendiente: render tests de componentes clave.

## Fase 8: Script de Preguntas Abiertas con Caché

-   [x] Script dedicado `src/scripts/generate-open-ended.mjs` para procesar abiertas:
    - Limpieza/anonimización/deduplicación (ya en `csv-processor`).
    - Batching a IA por pregunta (lotes) y fusión de resultados.
    - Esquema de salida: `src/data/openEnded.<reportId>.json` con `source` (csvPath, csvHash, rowCount, generatedAt), `preguntas` y `resumenGeneral`.
-   [x] Hash de contenido (`csvHash`) y reutilización del caché por defecto; `--force` para regenerar.
    
    Mejora de resiliencia:
    -   [x] Fallback offline y marca `source.offline: true` cuando no hay IA.
    
    Flags de integración en el generador principal:
    -   [x] `--skip-open-ended` (omite abiertas)
    -   [x] `--refresh-open-ended` (regenera caché antes de generar)
-   [x] Integración en el generador principal:
    - Cargar caché si existe y enriquecer el prompt principal.
    - Flags: `--skip-open-ended` (omite), `--refresh-open-ended` (regenera antes de generar).
-   [ ] Componente `src/components/AnalisisCualitativo.astro` para visualizar temas, sentimiento y citas.
