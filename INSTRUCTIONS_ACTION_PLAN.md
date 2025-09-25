# Guía Operativa · Iteración SEP25

Estas instrucciones reemplazan al prompt anterior del motor de planes de acción. El foco inmediato es sincronizar el reporte web con el análisis "Escala Madurez Digital SEP25" y entregar una experiencia consistente en todas las páginas auxiliares.

## 1. Fuentes de verdad obligatorias
- Métricas cuantitativas: `analisis/ANALISIS.md` (índice global 7.21; D1=7.19, D2=7.41, D3=6.94, D4=7.07).
- Benchmarks y metas: `analisis/baremos.md` y, si falta, `src/scripts/baremos.json`.
- Imágenes y descripciones: `analisis/graphs/*.png` + `.md` asociado.

## 2. Alineación de `globalData.*.json`
1. Normaliza `empleadosEvaluados` a 2399 y añade `header.analysis.sampleSize`.
2. Sustituye textos narrativos para que citen las cifras reales (puntuación empresa 7.21, sector 6.75, meta desde baremo avanzado).
3. Revisa campos duplicados/contradictorios entre OpenAI y Gemini y unifica estructura.
4. Valida con los esquemas (`npm test`) antes de cerrar iteración.

## 3. Correcciones de UI inmediatas
- Sección Uso de IA → los anillos deben leer `data-percent` del JSON; eliminar porcentajes hardcodeados.
- `.culture-header` → habilitar `flex-wrap`, `gap` y alineación para que el badge no se encime en pantallas pequeñas.
- Botón/enlace de regreso en `/respuestas` → priorizar `document.referrer`, fallback a `/gemini`.
- Estilos de `/respuestas` y `/empleados/[id]` → reutilizar variables y escalas tipográficas de `/css/style.css`.

## 4. Nueva página "Análisis SEP25"
- Crear ruta dedicada (ej. `/analisis/sep25` o similar) que:
  - Liste secciones clave del PDF en orden.
  - Muestre cada gráfico (`graphs/*.png`) con título y resumen del `.md`.
  - Incluya enlaces internos rápidos (índice) y navegación de retorno.
- Exponer enlace desde la página de inicio (que dejará de redirigir automáticamente a `/gemini`).

## 5. Documentación y QA
- Actualiza `README.md`, `PLAN.md`, `PROGRESS.md` con el estado alcanzado.
- Documenta decisiones relevantes (metas sectoriales, supuestos auditoría de datos).
- Checklist mínima antes de entregar:
  1. `npm test`
  2. Render `/openai`, `/gemini`, `/respuestas`, `/empleados/<demo>`
  3. Navegación al nuevo análisis desde la home.

> Nota: El motor de planes de acción individual permanece congelado en esta iteración; cualquier cambio debe documentarse como pendiente y no tocar el pipeline determinista hasta nuevo aviso.
