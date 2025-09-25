# Plan de Implementación SEP25

Este plan sustituye a los hitos previos y centra el trabajo en alinear el reporte con el documento "Análisis escala Madurez Digital SEP25" y en pulir la experiencia de navegación.

## Hito 1 · Datos globales alineados (Completado)
- Reconciliar `src/data/globalData.openai.json` y `src/data/globalData.gemini.json` con los valores del análisis SEP25.
- Actualizar textos narrativos para reflejar cifras reales (puntuación global 7.21, D1–D4, benchmark 6.75, meta desde baremos).
- Ajustar metadatos (`empleadosEvaluados = 2399`, `header.analysis`) y documentar el origen en cada JSON.
- Validar consistencia con `src/scripts/report-builder.js` y esquemas ajv.

## Hito 2 · Visualizaciones coherentes (Completado)
- Corregir la sección "Uso de IA" para que los gráficos circulares usen los porcentajes del JSON y animen en función de `data-percent`.
- Revisar gradientes/IDs duplicados y asegurar accesibilidad (contraste + aria-label).
- Reparar el layout de `culture-header` evitando solapamientos del badge en breakpoints estrechos.

## Hito 3 · Páginas administrativas unificadas (Completado)
- Añadir un control de navegación en `/respuestas` que regrese a la vista previa (openai|gemini).
- Reutilizar tokens tipográficos/colores del reporte global en `/respuestas` y `/empleados/[id]` para una UI consistente.
- Evaluar impresión/exportación de la vista individual tras los ajustes.

## Hito 4 · Página análisis SEP25 (Completado)
- Construir una página pública que replique la narrativa del PDF usando las imágenes existentes en `analisis/graphs`.
- Integrar la nueva página al inicio (index) con enlaces claros hacia `openai`, `gemini`, `/respuestas` y el análisis.
- Cuidar performance: lazy-load de imágenes y textos enlazados desde los `.md` de apoyo cuando exista.

## Hito 5 · QA y documentación (En seguimiento)
- Actualizar `README.md`, `PROGRESS.md` y notas operativas con los nuevos flujos.
- Ejecutar pruebas manuales/regresión y añadir TODOs para automatización futura si aplica.
- Registrar decisiones relevantes en `docs/HISTORIAL.md` cuando los hitos se completen.

### Recursos y dependencias
- Fuente de verdad: `analisis/ANALISIS.md`, `analisis/baremos.md`, `analisis/graphs/`.
- Scripts afectados: `report-builder`, `generate-report`, `baremos`.
- Validaciones: `npm test`, revisión visual en `/gemini` y `/openai`.
