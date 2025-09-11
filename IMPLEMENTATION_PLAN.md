# Plan de Implementación: Generador Automático de Reportes de Madurez Digital

Este documento detalla el plan por fases para implementar el algoritmo de generación de reportes dentro del proyecto Astro actual. El objetivo es crear un script que procese un archivo CSV de respuestas, realice análisis cuantitativos y cualitativos (usando IA), y genere el archivo `src/data/globalData.json` que alimenta el frontend del reporte.

## Fase 1: Configuración del Entorno y Carga de Datos [COMPLETADO]

El objetivo de esta fase es preparar la estructura del proyecto para el nuevo script y asegurar que podamos leer y procesar los datos crudos desde un archivo CSV.

1.  **Crear el Script Principal: [COMPLETADO]**
    *   Crea un nuevo archivo en `src/scripts/generate-report.mjs`. Este será el punto de entrada para toda la lógica de generación del reporte.

2.  **Instalar Dependencias: [COMPLETADO]**
    *   Necesitaremos una librería para parsear el archivo CSV. `papaparse` es una excelente opción. Ejecuta el siguiente comando para instalarla:
        ```bash
        npm install papaparse
        ```

3.  **Cargar y Parsear el CSV: [COMPLETADO]**
    *   Dentro de `generate-report.mjs`, implementa la lógica para leer un archivo CSV. El path al archivo CSV se pasará como un argumento de línea de comandos.
    *   Utiliza `papaparse` para convertir el contenido del CSV en un array de objetos JavaScript.
    *   Realiza una limpieza básica de los datos: elimina filas vacías o con datos incompletos que sean críticos para el análisis.

## Fase 2: Implementación del Módulo de Análisis Cuantitativo [COMPLETADO]

Esta fase se centra en traducir las respuestas de la encuesta en métricas y puntuaciones numéricas, siguiendo el `PLAN.md`.

1.  **Mapeo de Preguntas a Dimensiones: [COMPLETADO]**
    *   Crea un archivo de configuración, por ejemplo `src/scripts/mappings.json`.
    *   En este archivo, define un objeto que mapee cada encabezado de pregunta del CSV a su dimensión y sub-dimensión correspondiente en la estructura del `globalData.json`.

2.  **Motor de Cálculo: [COMPLETADO]**
    *   Itera sobre cada respuesta del CSV ya parseado.
    *   Aplica el mapeo para leer directamente las puntuaciones numéricas (que ya vienen en el CSV en una escala de 1 a 4).
    *   Calcula las puntuaciones promedio para:
        *   Cada sub-dimensión.
        *   Cada dimensión principal.
        *   La puntuación general (`puntuacionGeneral`).
    *   Calcula los porcentajes específicos requeridos, como los de `Uso de IA` y `Cultura Organizacional`.
    *   Almacena todos estos valores calculados en un objeto JavaScript que siga la estructura del `globalData.json`.

## Fase 3: Implementación del Módulo de Análisis Cualitativo (Intérprete de IA) [COMPLETADO]

En esta fase, integraremos un modelo de lenguaje grande (LLM) para generar las narrativas y análisis de texto.

1.  **Configurar Acceso a la API de IA: [COMPLETADO]**
    *   El script necesitará acceso a una API de IA generativa (ej. Google AI Studio para Gemini).
    *   Instala el cliente de la API correspondiente (ej. `npm install @google/generative-ai`).
    *   La configuración (como la API Key) debe manejarse a través de variables de entorno para mantener la seguridad.

2.  **Generación de Prompts: [COMPLETADO]**
    *   Crea funciones que generen los prompts dinámicamente, como se describe en `PLAN.md`.
    *   **Prompt para Síntesis de Texto Abierto:** Debe tomar una lista de respuestas a una pregunta abierta y pedir al LLM que identifique temas clave y genere una narrativa.
    *   **Prompt para Narrativas Generales:** Debe tomar los datos cuantitativos de la Fase 2 (ej. puntuación general, dimensión más fuerte/débil) y pedir al LLM que redacte la `introduccion`, el `resumenEjecutivo`, etc.

3.  **Ejecutar Llamadas a la IA: [COMPLETADO]**
    *   Implementa la lógica para enviar los prompts al LLM y recibir las respuestas.
    *   Añade manejo de errores para las llamadas a la API.

4.  **Integrar Resultados: [COMPLETADO]**
    *   Toma el texto generado por el LLM y añádelo al objeto de datos que se está construyendo.

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

## Fase 5: Integración y Documentación

Para finalizar, haremos que el script sea fácil de usar y documentaremos su funcionamiento.

1.  **Crear Comando en `package.json`:**
    *   Añade un nuevo script en la sección `"scripts"` de tu `package.json`:
        ```json
        "scripts": {
          "dev": "astro dev",
          "start": "astro start",
          "build": "astro build",
          "preview": "astro preview",
          "astro": "astro",
          "generate-report": "node src/scripts/generate-report.mjs"
        }
        ```

2.  **Actualizar `README.md`:**
    *   Añade una nueva sección al `README.md` del proyecto.
    *   Explica cómo ejecutar el nuevo script, incluyendo cómo pasar la ruta al archivo CSV de entrada.
    *   Documenta las variables de entorno necesarias (como la `API_KEY` para el servicio de IA).

    **Ejemplo de uso:**
    ```bash
    export GEMINI_API_KEY="tu_api_key_aqui"
    npm run generate-report -- --csv=./data/respuestas_banco.csv
    ```
