# Progreso de Implementación
<!-- progress:start -->
Progreso: 85% (completadas 46 de 54)
<!-- progress:end -->

Este documento se centra en el estado actual y próximos pasos. El historial detallado de tareas completadas fue movido a `docs/HISTORIAL.md`.

## Estado actual

- Sistema funcional end‑to‑end con validación de esquemas, caché de abiertas y modo offline.
- UI individual actualizada con chips demográficos y baremos segmentados.

## Próximos pasos

1) Listado de respuestas (rendimiento y noindex)
- Validar rendimiento con dataset real (2–5k filas) y ajustar lote/debounce.
- Añadir `meta noindex` y revisar `Cache-Control: private, no-store`.

2) Narrativa determinista y plan de acción
- Definir catálogo estático y reglas de selección.
- Integrar `action_plan` al JSON y mostrar sección en UI.

3) Alineación visual con global (baja prioridad)
- Unificar tokens/estilos; verificación de impresión.

4) Enriquecimiento con análisis
- Documentar discrepancia `2399 vs 2402` y fijar dataset canónico.
- (Opcional) Añadir `psychometrics.omega` y medias por dimensión de referencia.

5) Baremos segmentados (datos)
- Poblar `header.subject.demographics` desde CSV en generador individual.
- Refinar `selectBaremosScope` con mapeos definitivos.

