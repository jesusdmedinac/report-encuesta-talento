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

