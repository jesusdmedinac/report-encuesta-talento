# Guía abstracta para desarrollar un reporte de diagnóstico individual

Este documento describe, de forma agnóstica a tecnologías, cómo diseñar y generar un reporte individual similar al analizado. Se centra en objetivos, entradas, transformaciones, estructura de salida, reglas de negocio por sección, validación, privacidad y extensibilidad.

## Objetivo y alcance

- Objetivo: entregar a una persona un diagnóstico claro y accionable sobre su madurez/competencias, comparado con grupos de referencia y acompañado de un plan de acción.
- Alcance: un único reporte individual, generado bajo demanda a partir de datos de entrada (respuestas, métricas, identidad). Debe ser imprimible/exportable y entendible sin contexto adicional.

## Entradas y orígenes de datos

- Identidad mínima: nombre (y opcionalmente apellido), rol/cargo, fecha de evaluación.
- Respuestas o mediciones: valores por dimensión/subdimensión (p. ej., competencias digitales, madurez, uso de IA, factores organizacionales).
- Cohorte de referencia: conjunto anónimo de respuestas/mediciones para calcular promedios y percentiles (grupos generales y segmentados: edad, estudios, área, etc.).
- Metas/umbrales: metas sectoriales o internas (p. ej., objetivo = 8/10) y escalas de interpretación.

Requisitos de calidad de datos:
- Normalización de escalas a un mismo rango (p. ej., 0–10).
- Imputación/omisión definida para valores faltantes.
- Reglas de validación (rango, tipo, consistencia entre campos).

## Pipeline de transformación (alto nivel)

1) Ingesta y validación
- Validar identidad, formatos y rangos. Registrar incidencias no-bloqueantes.

2) Normalización
- Convertir todas las puntuaciones a una escala común (p. ej., 0–10). Guardar también el valor original si se requiere trazabilidad.

3) Agregación y cálculo de indicadores
- Cálculo de valores agregados por dimensión/bloque (p. ej., promedio ponderado por subcompetencia).
- Cálculo de “nivel” (etiqueta cualitativa) a partir de umbrales o reglas.
- Cálculo de brecha vs. meta (gap = meta − valor_actual; brecha_global = meta − promedio_colectivo).
- Cálculo de percentiles (general y por segmentos). Definir método: posición en distribución, interpolación, manejo de ties.

4) Generación de narrativa (opcional)
- Descripciones breves de resultados (p. ej., explicación de madurez, descripción por competencia). Pueden surgir de plantillas, reglas o modelos generativos con guardrails.

5) Personalización del plan de acción
- Selección de recursos/acciones a partir de reglas basadas en puntuaciones y gaps. Opcionalmente enriquecer con descripciones generadas y enlaces.

6) Ensamblado del reporte
- Construir un objeto de salida con estructura estable (ver Contrato de salida) y metadatos (versión de esquema, fecha, fuentes).

## Contrato de salida del reporte (JSON conceptual)

```json
{
  "schema_version": "1.0",
  "generated_at": "2025-01-15T12:34:56Z",
  "subject": { "name": "string", "role": "string", "assessed_on": "YYYY-MM-DD" },

  "summary": {
    "current_value": 0.0,               
    "target_value": 0.0,                
    "gap_value": 0.0,                   
    "level_label": "string",           
    "level_explanation": "string",     
    "collective_average": 0.0,          
    "global_gap": 0.0                   
  },

  "comparisons": {
    "general": {
      "percentile": 0,                  
      "justification": "string",       
      "scale": [0,25,50,75,100]
    },
    "by_age": {
      "percentile": 0,
      "user_range": "string",
      "justification": "string"
    },
    "by_education": {
      "percentile": 0,
      "user_level": "string",
      "justification": "string"
    }
  },

  "competencies_core": {
    "adaptation": 0.0,
    "efficiency": 0.0,
    "attitude": 0.0,
    "summary_text": "string"
  },

  "competencies_digital": {
    "description": "string",
    "skills": {
      "Skill A": { "value": 0.0, "description": "string" },
      "Skill B": { "value": 0.0, "description": "string" }
    },
    "blocks": {
      "cognitive": 0.0,
      "technical": 0.0,
      "creative_communication": 0.0
    }
  },

  "ai_adoption": {
    "description": "string",
    "scores": { "Adoption": 0.0, "Application": 0.0, "Ethics": 0.0 },
    "blocks": {
      "Category 1": { "Subskill X": 0.0, "Subskill Y": 0.0 }
    }
  },

  "environment": {
    "description": "string",
    "factors": {
      "Openness": 0.0,
      "Training": 0.0,
      "Leadership": 0.0
    }
  },

  "action_plan": {
    "training": ["<li>HTML permitido controlado</li>"],
    "continuous_practice": ["<li>HTML permitido controlado</li>"]
  },

  "meta": {
    "provenance": { "notes": "fuentes y versiones de cálculo" }
  }
}
```

Notas:
- Mantener unidades/rangos explícitos (0–10). Documentar escalas alternativas si aplican.
- El HTML en listas debe pasar por una capa de saneamiento o reglas estrictas (whitelist) si se renderiza como rich text.

## Secciones del reporte y reglas de negocio

1) Encabezado
- Presenta título, nombre, rol, fecha. Debe poder omitirse si faltan datos de identidad.

2) Tarjeta de resumen
- Muestra: valor actual, meta, brecha, promedio colectivo, etiqueta de nivel.
- Regla de nivel: definir mapeo de rangos a etiquetas (p. ej., Básico/Intermedio/Avanzado/Superior). Mantener configurable.
- Narrativa breve opcional que explique el nivel y su significado.

3) Comparaciones con grupos de referencia
- General: percentil del sujeto respecto a toda la cohorte. Mostrar una escala intuitiva (0–100%).
- Segmentos: percentil por edad, educación u otros (extensible: área, región, seniority). Incluir el “segmento del usuario” para contexto.
- Justificación: texto breve alineado a tramos de percentil (reglas claras y consistentes).

4) Competencias clave (3 métricas)
- Tres indicadores sintéticos (p. ej., adaptación, eficiencia, actitud). Definir fórmula de cómputo para cada uno.
- Acompañar de una descripción breve del resultado agregado.

5) Competencias digitales (detalle)
- Lista de habilidades con valor y breve descripción (estática o generada). Ordenar de mayor a menor para priorizar insights.
- Bloques agregados (p. ej., cognitivas, técnicas, creativas) como promedio de subconjuntos de habilidades.

6) Adopción de IA
- Descripción general.
- Tres métricas sintéticas (adopción, aplicación, ética) y un mapa por categorías→subskills.
- Mantener categorías y subskills abiertas/extensibles según dominio.

7) Entorno/Cultura organizacional
- Descripción general del contexto.
- Factores (3 o más) con valores normalizados. Asegurar que la interpretación sea clara (p. ej., mayor es mejor, o viceversa, pero consistente).

8) Plan de acción
- Dos bolsas de recomendaciones: formación (cursos/recursos) y práctica continua (tareas/retos).
- Selección por reglas: priorizar gaps y competencias con menor puntuación y mayor relevancia para el rol.
- Estilo de contenido: conciso, accionable, con llamadas a la acción claras. Evitar enlaces rotos; permitir HTML controlado.

9) Pie de reporte
- Información de versión del sistema y cláusula de confidencialidad.

## Algoritmos y fórmulas (referencia)

- Normalización: value_norm = (value_raw − min) / (max − min) × 10.
- Promedios ponderados: Σ(score_i × weight_i) / Σ(weight_i).
- Brecha: gap = target − current. Brecha global = target − avg_cohort.
- Percentil (ejemplo simple): ordenar población, posición relativa del valor; considerar métodos específicos (p. ej., PERCENTILE.INC/EXC) y documentar elección.
- Asignación de niveles: reglas por umbrales, revisadas con stakeholders.

## Generación de narrativa y guardrails

- Descripciones pueden basarse en plantillas parametrizadas (deterministas) o en modelos generativos.
- Si se usan modelos generativos:
  - Incluir instrucciones de estilo (objetivo, tono, longitud, evitar sesgos, no inventar datos).
  - Forzar grounding a los valores calculados (proveerlos como variables, evitar alucinaciones).
  - Aplicar post-procesamiento: trimming, filtros de seguridad, límites de longitud.

## Estados vacíos y resiliencia

- Sin identidad: ocultar encabezado y mostrar solicitud de identificación.
- Sin cohorte: mostrar solo métricas individuales; desactivar percentiles.
- Valores faltantes: mostrar 0/“Sin datos” con estilos neutros y explicar limitaciones.
- Errores de entrada: mensajes claros, no técnicos; permitir reintento.

## Accesibilidad e internacionalización

- Contraste adecuado en visualizaciones (texto legible en celdas con color).
- Alternativas textuales/etiquetas para elementos visuales (leyendas y descripciones).
- Números con separadores/locales adecuados; fechas localizadas. Estructurar para i18n.

## Impresión y exportación

- Diseño que evite cortes: evitar quiebres dentro de tarjetas; usar reglas de no-ruptura en el layout.
- Márgenes y tamaño de página definidos (p. ej., A4). Revisar que tipografías y colores imprima legibles.
- Evitar superposiciones (tooltips/overlays) en modos de exportación.

## Privacidad y seguridad

- Minimizar PII (solo lo necesario). Seudonimizar cuando sea posible.
- Consentimiento explícito para uso de datos y comparativos.
- Retención limitada y políticas de borrar bajo solicitud.
- Saneamiento de cualquier contenido enriquecido (HTML controlado).

## Validación y calidad

- Pruebas con datasets sintéticos (edge cases: extremos, vacíos, distribuciones sesgadas).
- Conjuntos dorados (golden) para validar cálculos de percentiles y brechas.
- Revisión con expertos de negocio para umbrales y textos.

## Versionado y trazabilidad

- Incluir `schema_version` y `generator_version` en la salida.
- Guardar `provenance` de datos (fuentes, fechas, versiones de reglas).
- Migraciones documentadas si cambia el contrato.

## Extensibilidad

- Estructura por bloques/secciones desacoplada del dominio (agregar nuevas dimensiones sin romper las existentes).
- Segmentos de referencia configurables (edad, estudios, área, región, seniority, etc.).
- Plan de acción ampliable (más categorías y criterios de priorización).

---

Checklist mínimo de aceptación (MVP):
- Entradas validadas y normalizadas a 0–10.
- Cálculo de: valor actual, meta, brecha, promedio colectivo.
- Percentil general y al menos 1 comparación segmentada.
- Tres métricas clave agregadas con regla de nivel documentada.
- Listado de competencias con valor y breve descripción.
- Bloques agregados por competencias.
- Tres métricas de adopción/uso responsable (IA u otro dominio equivalente).
- Factores del entorno con interpretación clara.
- Plan de acción con al menos 2 recomendaciones por bolsa.
- Exportación/impresión legible sin cortes.
