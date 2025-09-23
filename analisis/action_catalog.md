# Catálogo de acciones (plantilla base)

Este documento define el catálogo de iniciativas por dimensión, editable por humanos y/o IA. El builder convierte estas tablas a `src/scripts/action_catalog.json` y valida contra `action_catalog.schema.json`.

Notas:
- Columnas: `id | titulo | descripcion | areaEnfoque | prioridad | plazo | rolesPreferidos | tags`
- `rolesPreferidos`: coma separada; ejemplos: liderazgo, mandos, tecnico, comercial, operaciones, rrhh.
- `tags`: palabras clave para señales (ej. automatizacion, datos, seguridad, colaboracion, etica, prompt, cliente, procesos, innovacion).

---

### madurezDigital

| id    | titulo                                       | descripcion                                                                                                  | areaEnfoque               | prioridad | plazo         | rolesPreferidos                | tags                         | type | subdimensiones | objective | key_results |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | --------- | ------------- | ------------------------------ | ---------------------------- | ---- | -------------- | --------- | ----------- |
| MD-01 | Definir hoja de ruta de madurez digital       | Co-crear una hoja de ruta trimestral con priorización por impacto/esfuerzo y responsables claros.           | Estrategia y Gobierno     | Alta      | 6-8 semanas   | liderazgo, mandos              | roadmap, procesos, priorizacion | OKR | resolucionDeProblemas,proactividadDigital | Alinear iniciativas a resultados de negocio con ciclos trimestrales | resolucionDeProblemas:+1.0; proactividadDigital:+1.0 |
| MD-02 | Gobernanza de datos mínima viable             | Definir catálogo de datos críticos, data owners y políticas básicas de calidad y acceso.                    | Datos y Gobierno          | Alta      | 4-6 semanas   | liderazgo, operaciones, tecnico | datos, gobierno, calidad       | KPI | alfabetizacionDeDatos |
| MD-03 | Taller de resolución de problemas complejos   | Sesiones prácticas para aplicar técnicas de diagnóstico y solución estructurada a casos reales del negocio. | Talento y Formación       | Media     | 4-6 semanas   | mandos, tecnico                 | capacitacion, analitica        | KPI | resolucionDeProblemas |
| MD-04 | Célula de mejora continua                     | Crear una célula multidisciplinaria para iterar mejoras y medir impacto por sprint.                         | Estrategia y Gobierno     | Media     | 8-12 semanas  | liderazgo, operaciones          | procesos, experimentacion      | OKR | proactividadDigital,resolucionDeProblemas |

### brechaDigital

| id    | titulo                                       | descripcion                                                                                                  | areaEnfoque               | prioridad | plazo         | rolesPreferidos                | tags                         | type | subdimensiones |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | --------- | ------------- | ------------------------------ | ---------------------------- | ---- | -------------- |
| CD-01 | Programa de upskilling en competencias clave  | Formación práctica en adaptabilidad, colaboración y seguridad; con evaluación inicial y final.              | Talento y Formación       | Media     | 8-10 semanas  | rrhh, mandos                   | capacitacion, colaboracion, seguridad | OKR | colaboracionDigital,ciberseguridad |
| CD-02 | Guías operativas de buenas prácticas digitales| Playbooks cortos sobre herramientas críticas con ejemplos del negocio.                                       | Enablement                | Media     | 3-4 semanas   | operaciones, comercial         | guias, colaboracion, procesos | KPI | colaboracionDigital |
| CD-03 | Clínica de ciberseguridad aplicada            | Laboratorios guiados sobre phishing, gestión de contraseñas y protección de datos.                          | Seguridad                  | Media     | 3-4 semanas   | todos                           | seguridad, practicas           | KPI | ciberseguridad |
| CD-04 | Mentoring entre pares                         | Pareo mensual para práctica dirigida de competencias digitales con retos cortos.                            | Talento y Formación       | Baja      | 8 semanas     | mandos, tecnico                 | colaboracion, aprendizaje      | OKR | colaboracionDigital |

### usoInteligenciaArtificial

| id    | titulo                                       | descripcion                                                                                                  | areaEnfoque               | prioridad | plazo         | rolesPreferidos                | tags                         | type | subdimensiones | objective | key_results |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | --------- | ------------- | ------------------------------ | ---------------------------- | ---- | -------------- | --------- | ----------- |
| IA-01 | Pilotos de IA con casos de alto valor         | Identificar 2-3 casos de uso (productividad/cliente), ejecutar pilotos con control y medir ROI.             | Innovación Aplicada       | Alta      | 6-10 semanas  | tecnico, operaciones, liderazgo| ia, pilotos, productividad, cliente | OKR | nivelDeAdopcion,habilidadDeUso |
| IA-02 | Capacitación en prompt engineering y ética    | Talleres con plantillas de prompts, criterios de verificación y pautas de uso responsable.                  | Talento y Ética           | Media     | 4-6 semanas   | rrhh, mandos, comercial        | capacitacion, etica, prompt   | KPI | eticaYVerificacion,percepcionDeRiesgo |
| IA-03 | Biblioteca de casos y prompts reutilizables   | Repositorio curado de casos de uso y prompts por rol/proceso, con ejemplos verificados.                     | Enablement                | Media     | 3-4 semanas   | comercial, operaciones          | repositorio, prompt            | KPI | habilidadDeUso |
| IA-04 | Programa de adopción controlada               | Roadmap de adopción con pilotos escalonados, criterios de calidad y seguimiento de riesgos.                 | Innovación Aplicada       | Alta      | 8-12 semanas  | liderazgo, mandos               | adopcion, gobierno             | OKR | nivelDeAdopcion,percepcionDeRiesgo | Elevar adopción con control de calidad y gestión de riesgos | nivelDeAdopcion:+1.0; percepcionDeRiesgo:+1.0 |

### culturaOrganizacional

| id    | titulo                                       | descripcion                                                                                                  | areaEnfoque               | prioridad | plazo         | rolesPreferidos                | tags                         | type | subdimensiones | objective | key_results |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | --------- | ------------- | ------------------------------ | ---------------------------- | ---- | -------------- | --------- | ----------- |
| CU-01 | Ciclos de experimentación y reconocimiento    | Sprints mensuales de experimentación con vitrinas de reconocimiento a aprendizajes y resultados.            | Cultura y Cambio          | Media     | 3 meses       | liderazgo, mandos              | experimentacion, reconocimiento | KPI | experimentacion,reconocimiento |
| CU-02 | Programa de liderazgo digital                 | Formación a mandos sobre visión, métricas y comportamientos modelo para acelerar la cultura.                | Liderazgo                 | Alta      | 6-8 semanas   | liderazgo                      | liderazgo, objetivos          | OKR | liderazgoYVision | Consolidar liderazgo visible con métricas y cascada de objetivos | liderazgoYVision:+1.0 |
| CU-03 | Comunidades de práctica                        | Foros quincenales por temática para compartir aprendizajes y demos rápidas.                                 | Cultura y Cambio          | Media     | 8 semanas     | mandos, tecnico                 | comunidad, aprendizaje         | KPI | ambienteDeAprendizaje |
| CU-04 | Reconocimiento a iniciativas de mejora         | Mecanismo trimestral de reconocimiento a iniciativas con resultado medible.                                 | Cultura y Cambio          | Media     | 12 semanas    | liderazgo, mandos               | reconocimiento, resultados     | OKR | reconocimiento |
