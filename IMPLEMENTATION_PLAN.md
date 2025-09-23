# Plan de Implementación (Activo)

Este documento refleja únicamente tareas abiertas o en curso. Las fases y entregables ya completados se archivaron en `docs/HISTORIAL.md`.

## Fase 10: Listado de Respuestas (pendientes)

- Validar rendimiento con dataset real (2–5k filas) y ajustar tamaño de lote (50–100) y debounce (200–300 ms).
- Añadir `meta noindex` en la página y revisar headers de caché en hosting (`Cache-Control: private, no-store`).

## Fase 13: Narrativa determinista y plan de acción

- Definir catálogo estático de recomendaciones por dimensión/subdimensión (`src/scripts/action_catalog.json` o `config`).
- Implementar selector por reglas (prioridad: brecha alta × relevancia del rol).
- Integrar `action_plan` al JSON individual en el generador.
- Mostrar sección “Plan de acción” en la UI individual (imprimible).

## Fase 14: Alineación visual con Reporte Global (baja prioridad)

- Reutilizar tokens de color/tipografía del global y unificar patrones (tarjetas, divisores, barras, badges).
- Verificación de impresión multi‑navegador para consistencia visual.

## Fase 16: Enriquecimiento con análisis (metadatos y coherencia)

- Documentar la discrepancia `2399 vs 2402` y fijar dataset canónico para `empleadosEvaluados` y comparativas.
- (Opcional) Añadir `psychometrics.omega` y medias por dimensión de referencia si están disponibles.

## Fase 17: Baremos segmentados + Header demográfico

- Generador individual: poblar `header.subject.demographics` (rol, área, nivelEducativo, antigüedad, región/sede, género) con normalización y labels.
- Servicios de baremos: refinar `selectBaremosScope` con mapeos definitivos del CSV (roles D1/D4, educación D4; fallback a general).
- UI individual: validar sección de “Baremos del segmento” y chips demográficos con datos reales y pulir textos del scope.

---

Referencia de fases completadas: ver `docs/HISTORIAL.md`.

## Fase 18: Plan de acción individual OKR/KPI (determinista + IA opcional)

Objetivo: generar para cada individuo un plan de acción cualitativo, estructurado como OKRs ligeros y/o KPIs tácticos, seleccionado de forma determinista a partir de brechas y rol, con opción de enriquecimiento por IA para redacción.

Alcance y principios:
- Selección determinista en runtime (reglas). La IA no decide qué acciones; solo puede re‑redactar textos si se habilita.
- Catálogo versionado y validado (MD→JSON) con plantillas de iniciativas tipo OKR/KPI.
- Personalización mínima con señales de `openEnded` del individuo.

Artefactos y esquema:
- Catálogo: `src/scripts/action_catalog.json` (fuente MD en `analisis/action_catalog.md`).
- Esquema: `src/scripts/schemas/action_catalog.schema.json`.
- Campos por ítem (sugeridos):
  - `id`, `dimension`, `subdimensiones[]`, `rolesPreferidos[]`, `tags[]`
  - `type`: `OKR` | `KPI`
  - Si `OKR`: `objective`, `key_results[]` ({ `metric`, `target`, `plazo`, `cadencia` })
  - Si `KPI`: `metric`, `target`, `cadencia`
  - `descripcion`, `areaEnfoque`, `esfuerzo` (bajo|medio|alto), `impacto` (bajo|medio|alto), `responsableSugerido`, `prerequisitos?`, `dependencias?`

Pipeline de catálogo (IA asistida, con guardrails):
1) `analisis/action_catalog.md` redactado por IA o humano con tablas por dimensión/subdimensión.
2) Builder `src/scripts/build-action-catalog.mjs` convierte MD→JSON, agrega `version`/`source` y valida contra el esquema (ajv).
3) Comandos:
   - `npm run build-action-catalog` → genera/valida `action_catalog.json`.
   - `npm run draft-action-catalog -- --provider=<gemini|openai> --model=<...>` → bosquejo MD con IA; guarda artefactos en `./debug/` (requiere revisión humana).

Selección determinista (`selectIndividualActionPlan`):
4) Función pura en `src/scripts/services/` que:
   - Calcula `gapScore` por dimensión = `gap10` (orden desc) y detecta subdimensiones con menor `value10`.
   - Deriva `rol`/segmento desde `header.subject.demographics` para filtrar/ponderar ítems (`rolesPreferidos`, `tags`).
   - Recoge señales de `openEnded` (keywords) para ajustar prioridad/objetivos.
   - Ranking por score: `(gapDim × impacto) ÷ esfuerzo`, con límites de selección (3–5 iniciativas total).
   - Composición del resultado: 1 OKR de la peor dimensión + 1–2 KPIs tácticos (quick wins).

Integración (generador y UI):
5) `src/scripts/generate-individual-reports.mjs`:
   - Añadir flag `--actions|--no-actions` y `--ai` (para re‑redacción opcional del texto).
   - Incluir en salida `action_plan`:
     - `resumenGeneral` (determinista; si `--ai`, re‑redactado manteniendo estructura)
     - `criterios`: `{ top_gaps, role, signals_from_open_ended }`
     - `iniciativas[]`: `{ id, type, titulo, descripcion, areaEnfoque, objetivosClave|key_results, metricasExito|kpi, responsableSugerido, plazoEstimado, prioridad, rationale }`
6) `src/pages/empleados/[id].astro`:
   - Reusar sección existente “Plan de acción priorizado”; soportar `type` OKR/KPI y mostrar KR/KPI con baseline/target cuando exista.

IA opcional (enriquecimiento de texto):
7) Si `--ai`, usar `ai-analyzer` para re‑escribir `resumenGeneral`/`descripcion`/`rationale` con guardrails (no cambia estructura ni objetivos/targets).

Pruebas y validación:
8) Unit tests del selector con casos de borde (sin abiertas, sin rol, múltiples gaps, esfuerzos altos vs bajos).
9) Validación ajv del catálogo; snapshot para cambios.
10) QA manual en UI con 3–4 perfiles distintos (rol técnico, comercial, liderazgo, soporte).

Criterios de aceptación:
- El JSON individual incluye `action_plan` coherente con las brechas y el rol del sujeto.
- Máx. 3–5 iniciativas; al menos 1 OKR y 1 KPI cuando aplique.
- Con `--ai` activado, la redacción mejora pero los campos estructurados permanecen intactos.
