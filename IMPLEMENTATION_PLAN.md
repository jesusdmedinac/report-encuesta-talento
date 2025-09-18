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

1.  **Extracción de Datos Cualitativos:** Se modificará `csv-processor.js` para leer y agrupar todas las respuestas de texto de las preguntas abiertas (ej. `D1_OPEN`).

2.  **Generación de Objeto de Insights (`analisisCualitativo`):** Se realizarán llamadas preliminares a la IA en `ai-analyzer.js` para cada pregunta abierta. La IA analizará las respuestas y generará un objeto JSON estructurado con `temasClave`, `sentimientoGeneral` y `citasDestacadas`.

3.  **Nuevo Componente de Visualización:** Se creará un nuevo componente, `src/components/AnalisisCualitativo.astro`, diseñado específicamente para recibir y mostrar de forma clara y atractiva los insights generados en el paso anterior.

### 4.2. Generación de Narrativas Principales

1.  **Implementar Estrategia de Único Prompt con JSON:** Se construirá un único prompt que solicite a la IA la generación de un objeto JSON que contenga todos los textos de las secciones principales del reporte.

2.  **Inyección de Contexto Cuantitativo y Cualitativo:** El prompt principal se enriquecerá con los resultados del análisis cuantitativo y, crucialmente, con los insights (temas y citas) generados en la sub-fase 4.1.

3.  **Expandir el Esquema del JSON de IA:** Se solicitarán todas las claves necesarias para el reporte:
    *   `resumenEjecutivo`: Un objeto que contenga `resumenGeneral`, `fortalezas` y `oportunidades`.
    *   `introduccion`, `brechaDigital`, `madurezDigital`, etc.
    *   `planAccion` estructurado con `resumenGeneral` e `iniciativas`.

4.  **Integrar Resultados y Refactorizar Frontend:**
    *   Actualizar las funciones `build...` en `report-builder.js` para que consuman y ensamblen las nuevas estructuras de datos.
    *   **Reescribir el componente `src/components/PlanAccion.astro`** desde cero.
    *   **Refactorizar el componente `src/components/ResumenEjecutivo.astro`** para eliminar datos estáticos.
    *   **Integrar el nuevo componente `src/components/AnalisisCualitativo.astro`** en la página principal del reporte.

## Fase 5: Ensamblaje Final y Generación del Archivo [COMPLETADO]

Esta es la última fase del script, donde se une todo y se produce el archivo final.

1.  **Unir Datos Cuantitativos y Cualitativos: [COMPLETADO]**
    *   El orquestador principal (`generate-report.mjs`) une los resultados de `performQuantitativeAnalysis` y `performQualitativeAnalysis`.

2.  **Generar el JSON Final: [COMPLETADO]**
    *   El script escribe el objeto de datos completo en el archivo `src/data/globalData.[provider].json`.

3.  **Validación (Opcional pero Recomendado):**
    *   Considera crear un esquema JSON (schema) que defina la estructura de `globalData.json`.
    *   Añade un paso de validación en el script para asegurar que el JSON generado cumple con el esquema antes de guardarlo.

## Fase 6: Integración y Documentación [COMPLETADO]

Para finalizar, haremos que el script sea fácil de usar y documentaremos su funcionamiento.

1.  **Crear Comando en `package.json`: [COMPLETADO]**
    *   Añade un nuevo script en la sección `"scripts"` de tu `package.json`.

2.  **Actualizar `README.md`: [COMPLETADO]**
    *   Añade una nueva sección al `README.md` del proyecto.
    *   Explica cómo ejecutar el nuevo script, incluyendo cómo pasar la ruta al archivo CSV de entrada.
    *   Documenta las variables de entorno necesarias (como la `API_KEY` para el servicio de IA).

