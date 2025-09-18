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

En esta fase, integraremos un modelo de lenguaje grande (LLM) para generar **todas** las narrativas y análisis de texto del reporte, utilizando una estrategia de único prompt con respuesta JSON garantizada.

1.  **Implementar Estrategia de Único Prompt con JSON:**
    *   Modificar la función `performQualitativeAnalysis` para construir un único prompt que solicite a la IA la generación de un objeto JSON que contenga todos los textos necesarios.
    *   Configurar las llamadas a las APIs de IA para que utilicen su **modo JSON nativo** (`response_format: { type: "json_object" }` para OpenAI, `responseMimeType: "application/json"` para Gemini). Esto garantiza respuestas bien formadas y elimina errores de parseo.

2.  **Expandir el Esquema del JSON de IA:**
    *   De forma incremental, añadir nuevas claves al objeto JSON solicitado en el prompt para cubrir todas las secciones del reporte:
        *   `resumenEjecutivo`: Un objeto que contenga el `resumenGeneral` (párrafos de texto), `fortalezas` (un array de strings) y `oportunidades` (un array de strings).
        *   `introduccion`
        *   Textos para `brechaDigital`
        *   Párrafos para `madurezDigital`, `competenciasDigitales`
        *   Descripciones y resúmenes para `usoInteligenciaArtificial` y `culturaOrganizacional`.
        *   Un `planAccion` estructurado. Este objeto contendrá un `resumenGeneral` y un array de `iniciativas`. Cada iniciativa será un objeto con: `id`, `titulo`, `descripcion`, `areaEnfoque`, `objetivosClave` (array), `metricasExito` (array de objetos con `metrica` y `valorObjetivo`), `responsableSugerido`, `plazoEstimado`, y `prioridad`.

3.  **Integrar Resultados y Refactorizar Frontend:**
    *   Actualizar las funciones `build...` en `report-builder.js` para que consuman y ensamblen la nueva estructura del `planAccion`.
    *   **Reescribir el componente `src/components/PlanAccion.astro` desde cero** para que sea capaz de interpretar y renderizar visualmente el nuevo objeto `planAccion`, incluyendo el listado de iniciativas con todos sus detalles.
    *   **Refactorizar el componente `src/components/ResumenEjecutivo.astro`** para eliminar datos estáticos y asegurar que renderice correctamente los datos generados por la IA (fortalezas, oportunidades).
    *   **Refactorizar el componente `src/components/ResumenEjecutivo.astro`** para eliminar datos estáticos y asegurar que renderice correctamente los datos generados por la IA (fortalezas, oportunidades).

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

