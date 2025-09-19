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
### Individual
- Privacidad: no exponer PII; usar `employeeId` pseudónimo determinístico. El mapa `employeeId -> email` (si se requiere) debe guardarse en `./debug/.local-map.json` (gitignored).
- Costos: por defecto `--offline`. Habilitar `--ai` solo para un subconjunto con `--ids`/`--limit`.
- Escalabilidad: soportar `--limit` y `--concurrency` (cuando haya IA) para lotes.

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
