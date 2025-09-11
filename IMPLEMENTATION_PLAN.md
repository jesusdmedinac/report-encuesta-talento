# Plan de Implementación: Generador Automático de Reportes de Madurez Digital

Este documento detalla el plan por fases para implementar el algoritmo de generación de reportes dentro del proyecto Astro actual. El objetivo es crear un script que procese un archivo CSV de respuestas, realice análisis cuantitativos y cualitativos (usando IA), y genere el archivo `src/data/globalData.json` que alimenta el frontend del reporte.

## Fase 1: Configuración del Entorno y Carga de Datos [COMPLETADO]

...

## Fase 2: Implementación del Módulo de Análisis Cuantitativo [COMPLETADO]

...

## Fase 3: Generación Comprensiva de Narrativas por IA (Intérprete de IA)

En esta fase, integraremos un modelo de lenguaje grande (LLM) para generar **todas** las narrativas y análisis de texto del reporte, expandiendo la implementación inicial.

1.  **Refactorizar el Módulo de IA:**
    *   Modificar la función `performQualitativeAnalysis` para que orqueste múltiples llamadas a la API de IA, en lugar de una sola.
    *   La función deberá devolver un objeto `insights` que contenga todos los textos generados, mapeados a su ubicación en el `globalData.json` final.

2.  **Implementar Estrategia Multi-Prompt:**
    *   Crear una función generadora de prompts por cada sección del reporte que requiera texto dinámico (Introducción, Brecha Digital, etc.).
    *   Cada función de prompt recibirá los datos cuantitativos relevantes de la Fase 2 y deberá formatearlos en un contexto claro y conciso para el LLM.

3.  **Expandir la Generación de Contenido:**
    *   Implementar la lógica para generar los textos de todas las secciones identificadas, incluyendo:
        *   `resumenEjecutivo` (fortalezas, oportunidades, descripción del nivel)
        *   `introduccion.contenido`
        *   Textos de `brechaDigital`
        *   Párrafos en `madurezDigital`, `competenciasDigitales`
        *   Descripciones y resúmenes en `usoInteligenciaArtificial` y `culturaOrganizacional`
        *   Resumen del `planAccion`

4.  **Integrar Resultados Completos:**
    *   Actualizar la función `generateReportJson` para que tome el objeto `insights` completo y lo integre en la plantilla del `globalData.json`.

## Fase 4: Ensamblaje Final y Generación del Archivo [COMPLETADO]

Esta es la última fase del script, donde se une todo y se produce el archivo final.

1.  **Unir Datos Cuantitativos y Cualitativos: [COMPLETADO]**
    *   Asegúrate de que el objeto de datos principal contenga tanto los cálculos numéricos de la Fase 2 como las narrativas de texto de la Fase 3.

2.  **Generar el JSON Final: [COMPLETADO]**
    *   Utiliza el módulo `fs` de Node.js para escribir el objeto de datos completo en el archivo `src/data/globalData.json`.
    *   El contenido debe ser "pretty-printed" (formateado con indentación) para que sea legible por humanos.

3.  **Validación (Opcional pero Recomendado):**
    *   Considera crear un esquema JSON (schema) que defina la estructura de `globalData.json`.
    *   Añade un paso de validación en el script para asegurar que el JSON generado cumple con el esquema antes de guardarlo.

## Fase 5: Integración y Documentación [COMPLETADO]

Para finalizar, haremos que el script sea fácil de usar y documentaremos su funcionamiento.

1.  **Crear Comando en `package.json`: [COMPLETADO]**
    *   Añade un nuevo script en la sección `"scripts"` de tu `package.json`.

2.  **Actualizar `README.md`: [COMPLETADO]**
    *   Añade una nueva sección al `README.md` del proyecto.
    *   Explica cómo ejecutar el nuevo script, incluyendo cómo pasar la ruta al archivo CSV de entrada.
    *   Documenta las variables de entorno necesarias (como la `API_KEY` para el servicio de IA).

