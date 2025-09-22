# Guía para Agentes (AGENTS.md)

Este documento orienta a cualquier agente de IA (o colaborador) para trabajar en este repositorio de forma segura y efectiva.

## TL;DR
- Estado: sistema de generación de reportes funcional end-to-end; textos IA con caché y modo offline.
- Puntos de entrada:
  - `./generate.sh --provider=gemini|openai [flags]` (recomendado)
  - `npm run generate-report -- --csv=... --empresa=... --reportId=... --provider=... --model=...`
  - `npm run generate-respuestas-index -- --csv=... --out=public/respuestas-index.json` (listado admin)
- Datos fuente: `data/respuestas-por-puntos.csv` (mapeado correcto).
- Salida: `src/data/globalData.<provider>.json` y caché cualitativo `src/data/openEnded.<reportId>.json`.
- Salida individual (nuevo proceso independiente): `src/data/individual/<employeeId>.json` y opcional `src/data/ind-openEnded.<employeeId>.json`.
- Listado de respuestas: `public/respuestas-index.json` (para la página `/respuestas`).
  - Incluye `id` desde la columna `#` del CSV (fallback a hash si falta) para enlazar a `/empleados/{id}`.
- Tests: `npm test` (Node test runner).

## Estado Actual
- Arquitectura modular: `csv-processor`, `ai-analyzer`, `report-builder`, `validator`, `config`.
- Caché de abiertas con fallback offline (sin IA) para resiliencia.
- Validación con `ajv` + `ajv-formats` y esquemas en `src/scripts/schemas/`.
- Reintentos exponenciales en llamadas a IA (configurables por env).

## Baremos y Referencias de Sector (plan)
- Objetivo: reemplazar referencias arbitrarias por parámetros derivados del análisis y baremos.
- Artefactos propuestos (estáticos, versionados):
  - `src/scripts/baremos.json`: cortes por dimensión (D1–D4) para población general, y variantes por rol/educación cuando aplique (origen: `analisis/Baremos Madurez Digital SEP25.xlsx`).
  - `src/scripts/sector_reference.json`: promedio(s) de la muestra de referencia (benchmark) y metadatos de procedencia.
- Integración prevista en el reporte global:
  - `brechaDigital.puntuacionEmpresa`: sin cambios (promedio de D1–D4 en 1–10).
  - `brechaDigital.puntuacionPromedioSector`: media de la muestra de referencia (p. ej., 6.75 global o por dimensión si existe).
  - `brechaDigital.puntuacionMetaSector`: objetivo derivado de baremos (método configurable: `p90` o umbral mínimo de “Avanzado”). `META_SECTOR_SCORE` queda como fallback.
- Integración prevista en el reporte individual:
  - Añadir etiquetas de nivel por dimensión (`level_label`) usando el baremo general.
  - Mantener percentil general actual; percentiles/etiquetas segmentadas por rol/educación en una fase posterior.

## Comandos Clave
- Generación unificada (recomendado):
  - `./generate.sh --provider=gemini [--offline] [--refresh-open-ended] [flags_adicionales]`
  - `./generate.sh --provider=openai [--offline] [--refresh-open-ended] [flags_adicionales]`
- Caché de abiertas (manual):
  - `npm run generate-open-ended -- --csv=./data/respuestas-por-puntos.csv --reportId=<ID> --provider=<gemini|openai> --model=<modelo> [--force]`
- Reportes individuales (independiente del global):
  - `npm run generate-individual -- --csv=./data/respuestas-por-puntos.csv --empresa=<Empresa> [--ids=a,b] [--limit=N] [--provider=gemini|openai] [--model=<modelo>] [--ai] [--offline]`
- Índice para listado de respuestas:
  - `npm run generate-respuestas-index -- --csv=./data/respuestas-por-puntos.csv --out=public/respuestas-index.json`
- Desarrollo y pruebas:
  - `npm test`
  - `npm run dev` (visualización del reporte en `/gemini` o `/openai` si existen JSONs)
  - `./commit-all.sh` para comitear cambios locales con tests (ver opciones en el script)

### Scripts útiles
- `npm run build-baremos`: convierte `analisis/Baremos Madurez Digital SEP25.xlsx` a `src/scripts/baremos.json` (incluye versión/fuente). Nota: hoy llena los cortes generales; la extracción segmentada por rol/educación depende del layout del XLSX y puede requerir ajustes.
- `npm run set-sector-reference`: generar/actualizar `src/scripts/sector_reference.json` con medias (global/por dimensión) y metadatos.

### Flujo de commits sugeridos
- Tras completar cada paso significativo (p. ej., nueva función, integración, actualización de docs), el agente sugerirá un mensaje de commit conciso y descriptivo para facilitar el control de cambios y la trazabilidad. El usuario puede editar o usar el mensaje tal cual.

## Flags y Variables
- Flags de generación:
  - `--offline`: omite todas las llamadas a IA; usa datos cuantitativos y caché existente.
  - `--skip-open-ended`: no usa ni genera caché de abiertas.
  - `--refresh-open-ended`: regenera el caché antes de generar el reporte.
- Variables de entorno (opcional):
  - `GEMINI_API_KEY`, `OPENAI_API_KEY`: claves IA.
  - `CSV_PATH`, `EMPRESA`, `REPORT_ID`, `MODEL`, `PROVIDER`: defaults para `./generate.sh`.
  - `DEBUG_AI=1`: guarda respuestas crudas en `./debug` (cuando hay IA).
  - `AI_MAX_RETRIES` (default 3) y `AI_RETRY_BASE_MS` (default 800): reintentos IA.
  - `DEBUG_AI=1`: guarda respuesta cruda de IA. En fallos de parseo/validación siempre se guardan artefactos en `./debug/` aunque no esté activo.

## Flujo de Preguntas Abiertas
- Entrada: extraídas/limpiadas desde `csv-processor` (véase `OPEN_ENDED_QUESTIONS` en `config.js`).
- Caché: `src/data/openEnded.<reportId>.json` con `source`, `preguntas`, `resumenGeneral`.
- Generación del reporte: el caché se inyecta en el prompt; si la IA falla, se incluye tal cual en `globalData.<provider>.json` como `analisisCualitativo`.
- Fallback offline: si no hay red/IA, se generan temas/citas básicos para no bloquear.
  - El caché offline se marca con `source.offline: true` para señalizarlo en UI.

## Estructura Relevante
- `src/scripts/generate-report.mjs`: orquestador principal.
- `src/scripts/services/`:
  - `csv-processor.js`: parseo y análisis cuantitativo; limpieza cualitativa.
  - `ai-analyzer.js`: prompts, llamadas IA, reintentos, pre-análisis de abiertas.
  - `report-builder.js`: construcción del JSON final por secciones.
  - `validator.js`: validación con `ajv`/`ajv-formats`.
- `src/components/AnalisisCualitativo.astro`: visualización de abiertas.
- `src/pages/[report].astro`: integra todas las secciones.
- Individual:
  - `src/scripts/generate-individual-reports.mjs` (a implementar)
  - `src/pages/empleados/[id].astro` (detalle mínimo implementado)
  - Próximo contrato (inspirado en PRESEDENT_REPORT.md): agregar metadatos (`schema_version`, `generated_at`, `provenance`), valores normalizados a 1–10 y comparativos (promedio colectivo, meta/gap, percentil general) sin romper compatibilidad.
- Listado de respuestas:
  - `src/scripts/generate-respuestas-index.mjs` (implementado)
  - `src/pages/respuestas/index.astro` (implementado)

## Decisiones y Gotchas
- CSV correcto: usar `data/respuestas-por-puntos.csv`. Otros CSV sin prefijos de mapeo producirán valores vacíos.
- Modo offline: útil en entornos sin red o para CI; genera placeholders para textos IA.
  - El `Header` muestra badges de `provider`, `model` y `generationMode` (online, online-degraded, offline).
  - `AnalisisCualitativo` muestra badge “offline” si el caché lo indica.
- Esquema: `header.generatedAt` valida con formato `date-time` (ajv-formats requerido).
- Reintentos IA: automáticos ante 429/503/timeouts; ajustables por env.
### Sector y metas
- La “meta del sector” se calculará desde baremos o percentiles de referencia (método configurable: `p90` o umbral de "Avanzado"). El valor fijo `META_SECTOR_SCORE` queda como respaldo y deberá documentar su procedencia si se usa.
- Añadir `puntuacionPromedioSector` (benchmark) al reporte global desde la muestra de referencia del análisis.
### Individual
- Privacidad: no exponer PII; usar `employeeId` pseudónimo determinístico. El mapa `employeeId -> email` (si se requiere) debe guardarse en `./debug/.local-map.json` (gitignored).
- Costos: por defecto `--offline`. Habilitar `--ai` solo para un subconjunto con `--ids`/`--limit`.
- Escalabilidad: soportar `--limit` y `--concurrency` (cuando haya IA) para lotes.
- Comparativos/percentiles: primero promedio colectivo y percentil general (PERCENTILE.INC). Segmentados en una fase posterior.
- Metas/gaps: definir targets por dimensión en `config.js` para computar `gap10` (target − current).

## Próximos Pasos Sugeridos
- Tests adicionales: snapshots del JSON completo y render tests de componentes.
- Overrides por cliente/sector en `config` (umbrales/pesos/feature flags).
- UI/UX: colapsables en análisis cualitativo; badges de “modo offline”.

## Orden de Lectura Recomendada
1) `PROGRESS.md` → panorama y próximos pasos
2) `IMPLEMENTATION_PLAN.md` → decisiones técnicas y fases
3) Código en `src/scripts/` y componentes en `src/components/`
- Listado de respuestas
  - Filtrado client-side: normalizar búsqueda a minúsculas y sin acentos; comparar contra `nombreL` y `emailL`.
  - Performance: scroll infinito con lotes de 50–100 y `IntersectionObserver`.
  - Seguridad/privacidad: el sitio está detrás de auth; añadir `noindex` en la página y preferir `Cache-Control: private, no-store` para el asset.
