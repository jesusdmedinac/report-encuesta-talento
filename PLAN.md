¡Excelente iniciativa! Diseñar un algoritmo para automatizar la generación de este tipo de reportes a partir de datos crudos es un caso de uso perfecto para la IA.

A continuación, te presento el diseño de un algoritmo conceptual, sin código, que describe el proceso paso a paso para transformar las 2402 respuestas del CSV del Banco Guayaquil en el formato JSON estructurado y analítico que necesitas.

Este algoritmo está diseñado como un sistema modular que combina el análisis de datos tradicional con la inteligencia artificial generativa para la interpretación y redacción.

---

### **Diseño del Algoritmo: Generador de Reportes de Madurez Digital**

El objetivo es procesar un archivo CSV con respuestas de encuestas y generar un JSON analítico. El proceso se divide en cuatro fases principales.

#### **Fase 1: Preparación y Mapeo de Datos**

Esta fase se encarga de preparar los datos crudos y establecer las reglas para su interpretación.

1.  **Ingesta y Limpieza de Datos:**
    * El algoritmo leerá el CSV de las 2402 respuestas del Banco Guayaquil.
    * Realizará una limpieza básica: eliminar respuestas duplicadas o incompletas y estandarizar formatos (ej. texto a minúsculas).

2.  **Mapeo de Preguntas a Dimensiones:**
    * Se creará un "diccionario de mapeo" que asocie cada código de pregunta (ej. `D1_ADAPT`, `D2_DATA`) con su dimensión correspondiente en el JSON final (`Madurez Digital`, `Competencias Digitales`, etc.). Esto es fundamental para la agregación de datos.

3.  **Verificación de Escalas de Puntuación:**
    * El algoritmo confirmará que las respuestas de tipo Likert en el CSV ya son valores numéricos (escala de 1 a 4).
    * No se requiere una conversión de texto a número, lo que simplifica el procesamiento. El script directamente parseará estos valores como números.

---

#### **Fase 2: Módulo de Análisis Cuantitativo (El Motor de Cálculo)**

Este módulo se enfoca en procesar los datos numéricos para obtener todas las métricas, puntuaciones y porcentajes.

1.  **Cálculo de Puntuaciones por Dimensión:**
    * Para cada una de las 2402 respuestas, el algoritmo leerá directamente el valor numérico de cada pregunta.
    * Luego, calculará la **puntuación promedio** para cada dimensión principal (Madurez Digital, Competencias Digitales, Cultura, etc.) promediando los resultados de todas las preguntas asociadas a esa dimensión.
    * Hará lo mismo para las sub-dimensiones (ej. `Capacidad para aprender`, `Actitud frente a nuevas tecnologías`).

2.  **Cálculo de la Puntuación General:**
    * El algoritmo promediará las puntuaciones de las dimensiones principales para obtener la `puntuacionGeneral` de Banco Guayaquil.

3.  **Análisis de Datos Específicos:**
    * **Competencias:** Para la sección `competenciasDigitales`, calculará el promedio de cada competencia (ej. `Comunicación y Colaboración Digital`) y lo convertirá a un score sobre 100 (`score: 30`).
    * **Uso de IA:** Analizará las respuestas de la `Dimensión 4` para calcular los porcentajes de `Adopción`, `Uso en el Trabajo` y `Ética`.
    * **Métricas de Cultura:** Procesará las respuestas de la `Dimensión 3` para obtener los porcentajes de `Adopción de nuevas herramientas`, `Flexibilidad al cambio`, etc.

4.  **Generación de Datos de Cabecera:**
    * Rellenará los datos del `header`: `empresa: "Banco Guayaquil"`, `fechaDiagnostico: (fecha actual)`, `empleadosEvaluados: 2402`.

Al final de esta fase, el algoritmo tendrá un objeto estructurado con todos los valores numéricos necesarios para el JSON.

---

#### **Fase 3: Módulo de Análisis Cualitativo (Generación Comprensiva de Narrativas por IA)**

En esta fase, la IA generativa crea todos los textos analíticos del reporte. El proceso se divide en dos pasos clave para asegurar la máxima calidad y relevancia.

1.  **Pre-Análisis de Respuestas Abiertas y Generación de Insights:**
    *   Extracción y normalización: el script agrupará las respuestas de texto (ej. `D1_OPEN`), aplicará anonimización básica, limpieza, y deduplicación.
    *   Batching y control de tokens: se ejecutará una **primera pasada de IA** por lotes para identificar `temas` y sentimiento sin exceder límites de contexto; luego se fusionarán resultados.
    *   Se generará un objeto `analisisCualitativo` con estructura estable: `temas` [{ id, etiqueta, palabrasClave, conteo, sentimiento, citas }], `resumenGeneral` y `metricaSentimiento`.
    *   Este objeto se visualizará con un componente dedicado y servirá como contexto para el prompt principal.

2.  **Generación de Narrativas Principales con Contexto Enriquecido:**
    *   Se ejecutará una **segunda y única llamada a la IA** para generar el resto de las secciones del reporte (`resumenEjecutivo`, `introduccion`, `planAccion`, etc.).
    *   El prompt para esta llamada será enriquecido con dos tipos de contexto:
        1.  Los **datos cuantitativos** de la Fase 2 (puntuaciones, promedios).
        2.  Los **insights cualitativos** (temas y citas) generados en el paso anterior.
    *   Se utilizará el **modo JSON** nativo y se validará la salida contra un esquema pactado antes de continuar.

4.  **Ejemplo de Flujo de Prompts (Conceptual):**
    *   **Prompt 1 (Pre-Análisis):** *"Analiza las siguientes respuestas a la pregunta '...': {respuestas_abiertas_raw}. Devuelve un JSON con las claves `temasClave` (array de strings), `sentimientoGeneral` (string) y `citasDestacadas` (array de 3 strings)."*
    *   **Prompt 2 (Principal):** *"Eres un consultor experto. Basado en los datos cuantitativos {datos_cuantitativos} y los siguientes insights cualitativos {insights_del_paso_anterior}, genera una respuesta JSON con las claves `resumenEjecutivo` (incluyendo fortalezas y oportunidades), `introduccion` y `planAccion` (con iniciativas detalladas). Asegúrate de que tus textos reflejen tanto los números como los temas mencionados por los empleados."*

--- 

#### **Fase 4: Módulo de Ensamblaje y Generación del JSON Final**

Esta es la última etapa, donde se unen los resultados de las fases anteriores.

1.  **Creación de la Plantilla JSON:**
    * El algoritmo utilizará una plantilla que replica la estructura del JSON de Profermaco, pero con marcadores de posición para los datos (ej. `"puntuacionEmpresa": {score_brecha_digital}`).

2.  **Poblado de la Plantilla:**
    * Insertará los datos numéricos de la Fase 2 y los textos generados por la IA de la Fase 3 en los lugares correspondientes de la plantilla.

3.  **Validación y Exportación:**
    * Validar contra el esquema del `Report` final; añadir metadatos en `header` (`schemaVersion`, `promptVersion`, `provider`, `model`, `generatedAt`).
    * Guardar el archivo sólo si pasa la validación, con logs trazables.

---

#### **Fase 5: Validación, Configuración y Trazabilidad**

1.  **Esquemas y Contratos:** definir esquemas (zod/ajv) para `AIResponse` y `Report` y validarlos en puntos de entrada/salida.
2.  **Contratos de Datos Compartidos:** establecer tipos compartidos (TS/JSDoc) entre `ai-analyzer`, `report-builder` y componentes.
3.  **Configuración Centralizada:** mover valores mágicos a `config.js` (umbrales, pesos, límites IA, feature flags) con overrides por sector/cliente/entorno.
4.  **Observabilidad:** incluir versionado de `schemaVersion`/`promptVersion`, logs estructurados y opción de persistir `rawAiResponse` en modo debug (sin PII).

---

#### **Fase 6: Preguntas Abiertas con Caché (Desacoplado)**

Para controlar tiempos y costos, el pre‑análisis cualitativo de preguntas abiertas se separa en un script dedicado con caché reutilizable.

1.  **Script dedicado:** `src/scripts/generate-open-ended.mjs`.
    - Lee CSV, limpia/anonimiza/deduplica y ejecuta IA por lotes (batching + fusión).
    - Escribe `src/data/openEnded.<reportId>.json` con estructura:
      - `source`: { csvPath, csvHash, rowCount, generatedAt }
      - `preguntas`: { D1_OPEN: { temas[], resumenGeneral, metricaSentimiento, citas } ... }
      - `resumenGeneral` global.
2.  **Caché por hash:** usa `csvHash` para evitar recomputar si los datos no cambian; `--force` fuerza regeneración.
3.  **Integración en generador principal:**
    - `generate-report.mjs` cargará `openEnded.<reportId>.json` si existe y lo inyectará al prompt principal.
    - Flags: `--skip-open-ended` (omite uso), `--refresh-open-ended` (regenera antes de generar el reporte).
4.  **Visualización:** componente `AnalisisCualitativo.astro` muestra temas, sentimiento y citas.

Con este diseño, tendrás un sistema robusto, trazable y gobernable capaz de generar análisis profundos y personalizados para cualquier empresa, manteniendo la coherencia y la calidad del reporte final con tiempos de ejecución predecibles.

---

## Integración de Baremos y Referencias de Sector (Ampliación)

Objetivo: anclar comparativas y metas del reporte a datos del análisis, evitando constantes arbitrarias.

- Mapa de dimensiones (anclaje D1–D4 → sistema):
  - D1 → `madurezDigital`, D2 → `brechaDigital` (Competencias), D3 → `culturaOrganizacional`, D4 → `usoInteligenciaArtificial`.
- Baremos (población general y variantes por rol/educación): convertir `analisis/Baremos Madurez Digital SEP25.xlsx` a `src/scripts/baremos.json` (con `version` y `source`).
- Referencia de sector: crear `src/scripts/sector_reference.json` con la media global/por dimensión de la “muestra de referencia” (benchmark) y su procedencia.
- Cálculos en el reporte global:
  - `brechaDigital.puntuacionEmpresa`: promedio de D1–D4 en 1–10 (sin cambios).
  - `brechaDigital.puntuacionPromedioSector`: media de la referencia (p. ej., 6.75; por dimensión si está disponible).
  - `brechaDigital.puntuacionMetaSector`: derivada de baremos. Métodos admitidos:
    - `p90`: percentil 90 por dimensión; meta global = promedio D1–D4.
    - `advanced_min`: límite inferior del nivel “Avanzado” por dimensión; meta global = promedio D1–D4.
  - `META_SECTOR_SCORE` se conserva como fallback documentado.
- Reporte individual:
  - Añadir `level_label` por dimensión (baremo general).
  - Mantener `summary.dimensions.*` y `percentile` general; segmentados (rol/educación) en fase posterior.

Validación y pruebas:
- Tests de bordes “Desde/Hasta” (incluyendo los +0.01 del XLSX) para la asignación de niveles.
- Snapshot de `baremos.json` y coherencia con ejemplos del documento.
- Verificación de que el cambio no rompe el esquema actual ni la UI.

Fuente de baremos preferida:
- Mantener `analisis/baremos.md` como fuente de verdad editable (MD → JSON con `npm run build-baremos-md`).

Metadatos en header:
- Incluir `header.analysis` con `sampleSize`, `baremos.version`/`source` y `reference.source` para trazabilidad.
