# Progreso de Implementación: Generador de Reportes
<!-- progress:start -->
Progreso: 85% (completadas 46 de 54)
<!-- progress:end -->


Este documento registra el estado actual del plan de implementación, los pasos completados y los pensamientos estratégicos para las siguientes fases.

---

## Estado Actual

**Fase Actual:** **Refinamiento Final + Robustez Operativa.** El sistema está funcional de extremo a extremo. Se integró validación de la salida de IA, reintentos con backoff, modo offline y trazabilidad de `generationMode` en el `header`. La fase actual se centra en pulir detalles de visualización/observabilidad y ampliar cobertura de pruebas.

### Pasos Completados

-   [x] **Fase 1 y 2: Carga y Análisis Cuantitativo:** Completadas.

-   [x] **Fase de Refactorización (SOLID, DRY, SoC):**
    -   [x] **Fase 1 (Estructural):** Descomposición del script monolítico en módulos con responsabilidades únicas (`csv-processor`, `ai-analyzer`, `report-builder`, etc.).
    -   [x] **Fase 2 (Funcional):** Descomposición de `generateReportJson` en funciones "constructoras" (`build...`) más pequeñas y puras.
    -   [x] **Verificación:** Verificación exitosa de la refactorización sin regresiones funcionales.

-   [x] **Fase 3: Análisis Cualitativo (Intérprete de IA):**
    -   [x] Implementación de estrategia de **único prompt con respuesta JSON garantizada** para Gemini y OpenAI.
    -   [x] **Contenido generado:** La IA ahora genera el `resumenEjecutivo`, la `introduccion` y la sección `brechaDigital`.

-   [x] **Fase de Estabilización y Mejora:**
    -   [x] **Corrección de Bugs de Renderizado:** Se solucionaron errores de `TypeError` en los componentes de Astro (`UsoInteligenciaArtificial`, `CulturaOrganizacional`) al asegurar que la estructura de datos generada por `report-builder.js` coincida con la esperada por los componentes.
    -   [x] **Mejora de Trazabilidad:** Se añadió el `provider` y `model` de IA al objeto `header` en los JSON generados, permitiendo identificar qué motor y modelo se utilizó para cada reporte.

-   [x] **Fase 4 y 5: Ensamblaje y Documentación:** Completadas.

---

## Próximos Pasos

1.  **Validación de Esquema y Contratos de Datos:**
    -   [x] Definir esquemas para `AIResponse` y para el `Report` final (ajv + ajv-formats).
    -   [x] Validar la respuesta de IA (con tolerancia para `insights.puntos` como string u objeto `{icono, texto}`).
    -   [x] Validar el objeto final consumido por los componentes antes de escribir el archivo.
    -   [x] Añadir `schemaVersion`, `promptVersion` y `generationMode` al `header` para trazabilidad.

2.  **Análisis y Visualización de Preguntas Abiertas (con caché):**
    -   [x] `csv-processor.js`: extracción, normalización, anonimización y deduplicación de texto libre.
    -   [x] Script dedicado `src/scripts/generate-open-ended.mjs` para pre‑análisis por lotes (IA) y generación de caché.
    -   [x] Salida de caché: `src/data/openEnded.<reportId>.json` con `source` (csvPath, csvHash, rowCount, generatedAt) + `preguntas` + `resumenGeneral`.
    -   [x] Flags en el generador principal: `--skip-open-ended` (omite) y `--refresh-open-ended` (regenera caché).
    -   [x] Carga del caché en `generate-report.mjs` y uso para enriquecer el prompt principal y la sección `AnalisisCualitativo` (badge "offline" si el caché proviene de fallback).
    -   [x] Crear `src/components/AnalisisCualitativo.astro` para visualizar insights.
    -   [x] Fallback offline: si la IA falla por red, el script genera un caché con temas y citas básicas a partir de texto.

3.  **Configuración y Parametrización:**
    -   [x] Mover valores mágicos (ej. `puntuacionMetaSector`) a `config.js` con overrides por sector/cliente/entorno.
    -   [ ] Incluir `umbrales`, `pesos`, `limitesIA` y `featureFlags`.
    -   Nota: avance parcial — centralizados `META_SECTOR_SCORE`, paleta (`COLORS`), gradientes IA (`IA_CHARTS`), límites de batch (`LIMITES_IA`), `UMBRAL/ PESOS/ FEATURE_FLAGS`; pendientes overrides por cliente/sector.

4.  **Observabilidad y Trazabilidad:**
    -   [x] Incluir en `header`: `provider`, `model`, `schemaVersion`, `promptVersion`, `generatedAt`, `generationMode`.
    -   [x] Reintentos IA con backoff exponencial (configurables por `AI_MAX_RETRIES`, `AI_RETRY_BASE_MS`).
    -   [x] Artefactos de depuración al fallar parseo/validación IA en `./debug/`.

5.  **Tests Mínimos de Regresión:**
    -   [x] Unit tests para `csv-processor` y `report-builder`.
    -   [x] Snapshots del JSON final (proyección) para detectar regresiones estructurales.
-   [ ] Render de componentes clave (opcional) con datos mock.

6.  **Reportes Individuales (proceso independiente):**
    -   [x] Implementar `generate-individual-reports.mjs` (CLI separado, offline por defecto, con `--limit`).
    -   [ ] Crear esquema `individual.schema.json` y validar salidas.
    -   [x] Añadir ruta Astro `/empleados/[id]` (detalle mínimo) para visualizar JSON individual.
    -   [ ] Asegurar que no se exponga PII; usar `employeeId` pseudónimo o confirmar uso de PII bajo auth.
    -   [x] Documentar comandos en README y AGENTS (listado básico).

7.  **Listado de Respuestas (búsqueda + infinito):**
    -   [x] Definir alcance y plan en docs (README, AGENTS, IMPLEMENTATION_PLAN).
    -   [x] Implementar `generate-respuestas-index.mjs` que produzca `public/respuestas-index.json` (incluye `id`).
    -   [x] Crear página `src/pages/respuestas/index.astro` con buscador e infinito (client-side, debounce + IntersectionObserver) y enlaces a `/empleados/{id}`.
    -   [ ] Validar rendimiento con dataset real y ajustar tamaño de lote (50–100) y debounce (200–300 ms).
    -   [ ] Añadir `noindex` y revisar headers de caché en hosting.

8.  **Página Individual imprimible:**
    -   [x] Rediseñar `src/pages/empleados/[id].astro` con tiles, barras por subdimensión y secciones claras.
    -   [x] Añadir `@media print` (ocultar navegación, botón imprimir; `page-break-inside: avoid`).
    -   [x] Etiquetas de nivel (bajo/medio/alto) con colores aptos para impresión.
    -   [x] Escala de visualización ajustada a 1–10 (x2.5) en tiles y barras.
    -   [ ] (Opcional) Delta vs. promedio global si se carga `globalData.*.json`.
    -   [x] Refinar resumen KPI: cartas por dimensión con oración integrada.

9.  **Contrato individual y comparativos (PRESEDENT_REPORT.md):**
    -   [x] Añadir metadatos al JSON individual: `schema_version`, `generated_at`, `provenance`, `subject.assessed_on`.
    -   [x] Normalizar a 1–10 en el generador y conservar crudos 1–4 para trazabilidad.
    -   [x] Calcular `collective_average10` por dimensión (cohorte completa).
    -   [x] Definir `targets` en `config.js` y computar `gap10`.
    -   [x] Calcular percentil general (PERCENTILE.INC) por dimensión.
    -   [x] Actualizar UI individual para mostrar resumen (valor, meta, brecha, promedio colectivo).
    -   [x] Mostrar percentil en la UI individual.

10. **Narrativa determinista y plan de acción:**
    -   [x] Añadir narrativa breve por dimensión en la UI (oración clara).
    -   [ ] Definir catálogo estático de recomendaciones por dimensión/subdimensión.
    -   [ ] Seleccionar acciones por reglas (top brechas) y agregar `action_plan` al JSON.
    -   [ ] Mostrar sección “Plan de acción” en la página individual.

11. **Alineación visual con reporte global (baja prioridad):**
    -   [ ] Reutilizar tokens de color y tipografía del global.
    -   [ ] Unificar patrones de tarjetas y divisores.
    -   [ ] Ajustar barras y badges al estilo global.
    -   [ ] Verificación de impresión para consistencia.

---

12. **Baremos y referencias de sector**

-   [x] Convertir `analisis/Baremos Madurez Digital SEP25.xlsx` a `src/scripts/baremos.json` (población general y variantes por rol/educación; con `version`/`source`).
-   [x] Crear `src/scripts/sector_reference.json` con media(s) de la muestra de referencia y metadatos.
-   [x] Helper `assignLevel(dim, score10)` (fase 1: baremo general) y `computeSectorTargets({ method })` (`p90` o `advanced_min`).
-   [x] Integrar en global: `puntuacionPromedioSector` (benchmark) y `puntuacionMetaSector` (derivada, con fallback).
-   [ ] Integrar en individual: `level_label` por dimensión (baremo general).
-   [ ] Tests de límites “Desde/Hasta” y coherencia con ejemplos.

13. **Metadatos del análisis y dataset canónico**

-   [ ] Añadir `header.analysis` opcional con `omega`, `sampleSize`, `baremos.version`, `reference.source`.
-   [ ] Resolver discrepancia de N (2399 vs 2402) y fijar dataset para `empleadosEvaluados` y comparativas.

---

## Pensamientos y Estrategia

*   **Arquitectura Robusta:** Modular y extensible; SOLID/DRY aplicados.
*   **Estrategia de IA:** Único prompt con JSON + validación de esquema; degradación controlada y modo offline garantizan continuidad.
*   **Gobernanza de Datos:** Versionado de esquemas y prompts; trazabilidad con `generationMode` y artefactos de depuración.

---

## Actualizaciones Recientes

-   Se añadió un fallback offline al pre‑análisis de abiertas para garantizar caché útil incluso sin conectividad.
-   Se integró `analisisCualitativo` en el JSON final y en la página del reporte.
-   Se ajustó la validación del esquema para `generatedAt` (string simple) mientras se evalúa integrar `ajv-formats`.
