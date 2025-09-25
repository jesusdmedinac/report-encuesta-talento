# Plan Maestro · Alineación SEP25

## Objetivo
Reflejar fielmente el análisis "Escala Madurez Digital SEP25" en el sitio, garantizando coherencia de datos, narrativa y experiencia de navegación.

## Entregables principales
1. **Datos consistentes**: `globalData.openai.json` y `globalData.gemini.json` con cifras 1:1 contra el documento de análisis (puntuación global 7.21, D1–D4, benchmark 6.75, meta desde baremos avanzados).
2. **Reporte global**: Secciones de "Uso de IA" y "Cultura Organizacional" corregidas para representar los datos reales y comportarse correctamente en desktop/tablet/móvil.
3. **Backoffice unificado**: `/respuestas` con navegación de retorno y look & feel alineado al reporte; `/empleados/[id]` con los mismos tokens visuales.
4. **Página de análisis SEP25**: Nueva ruta que replica el PDF con las imágenes de `analisis/graphs`, accesible desde la página de inicio.
5. **Documentación actualizada**: README, progreso y guías internas reflejando el nuevo flujo y las fuentes de verdad.

## Flujo de trabajo
1. **Recolección**: extraer métricas y metas de `analisis/ANALISIS.md` + `analisis/baremos.md`; validar qué falta en JSON actuales.
2. **Normalización**: actualizar ambos `globalData.*.json` y, si aplica, ajustes en scripts para evitar regresiones en próximas generaciones.
3. **UI**: aplicar fixes en componentes (gráficos circulares, `culture-header`), reusar estilos globales en páginas auxiliares.
4. **Experiencia completa**: rediseñar la home (dejar de redirigir) y enlazar la nueva página de análisis.
5. **QA + docs**: prueba manual, `npm test`, actualización de documentación y notas de release.

## Riesgos y mitigaciones
- **Desfase futuro de datos**: Documentar fuente (sampleSize, fecha corte) y considerar automatizar validaciones en el generador.
- **Carga de imágenes**: Usar `loading="lazy"` y tamaños responsivos en la página de análisis para evitar saltos de layout.
- **Doble mantenimiento de estilos**: Centralizar tokens en `/css/style.css` y evitar estilos en línea en las páginas administrativas.

## Hechos pendientes
- Evaluar si el pipeline de generación debe incorporar directamente los baremos actualizados para futuros reportes.
- Diseñar pruebas automatizadas específicas para los datos alineados (snapshot validando D1–D4 y benchmark).
