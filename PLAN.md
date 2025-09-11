¡Excelente iniciativa! Diseñar un algoritmo para automatizar la generación de este tipo de reportes a partir de datos crudos es un caso de uso perfecto para la IA.

A continuación, te presento el diseño de un algoritmo conceptual, sin código, que describe el proceso paso a paso para transformar las 2402 respuestas del CSV del Banco Guayaquil en el formato JSON estructurado y analítico que necesitas.

Este algoritmo está diseñado como un sistema modular que combina el análisis de datos tradicional con la inteligencia artificial generativa para la interpretación y redacción.

---

### **Diseño del Algoritmo: Generador de Reportes de Madurez Digital**

El objetivo es procesar un archivo CSV con respuestas de encuestas y generar un JSON analítico. El proceso se divide en cuatro fases principales.

#### **Fase 1: Preparación y Mapeo de Datos**

Esta fase se encarga de preparar los datos crudos y establecer las reglas para su interpretación.

1.  **Ingesta y Limpieza de Datos:**
    * El algoritmo leerá el CSV de las 2402 respuestas del Banco Guayaquil.
    * Realizará una limpieza básica: eliminar respuestas duplicadas o incompletas y estandarizar formatos (ej. texto a minúsculas).

2.  **Mapeo de Preguntas a Dimensiones:**
    * Se creará un "diccionario de mapeo" que asocie cada código de pregunta (ej. `D1_ADAPT`, `D2_DATA`) con su dimensión correspondiente en el JSON final (`Madurez Digital`, `Competencias Digitales`, etc.). Esto es fundamental para la agregación de datos.

3.  **Verificación de Escalas de Puntuación:**
    * El algoritmo confirmará que las respuestas de tipo Likert en el CSV ya son valores numéricos (escala de 1 a 4).
    * No se requiere una conversión de texto a número, lo que simplifica el procesamiento. El script directamente parseará estos valores como números.

---

#### **Fase 2: Módulo de Análisis Cuantitativo (El Motor de Cálculo)**

Este módulo se enfoca en procesar los datos numéricos para obtener todas las métricas, puntuaciones y porcentajes.

1.  **Cálculo de Puntuaciones por Dimensión:**
    * Para cada una de las 2402 respuestas, el algoritmo leerá directamente el valor numérico de cada pregunta.
    * Luego, calculará la **puntuación promedio** para cada dimensión principal (Madurez Digital, Competencias Digitales, Cultura, etc.) promediando los resultados de todas las preguntas asociadas a esa dimensión.
    * Hará lo mismo para las sub-dimensiones (ej. `Capacidad para aprender`, `Actitud frente a nuevas tecnologías`).

2.  **Cálculo de la Puntuación General:**
    * El algoritmo promediará las puntuaciones de las dimensiones principales para obtener la `puntuacionGeneral` de Banco Guayaquil.

3.  **Análisis de Datos Específicos:**
    * **Competencias:** Para la sección `competenciasDigitales`, calculará el promedio de cada competencia (ej. `Comunicación y Colaboración Digital`) y lo convertirá a un score sobre 100 (`score: 30`).
    * **Uso de IA:** Analizará las respuestas de la `Dimensión 4` para calcular los porcentajes de `Adopción`, `Uso en el Trabajo` y `Ética`.
    * **Métricas de Cultura:** Procesará las respuestas de la `Dimensión 3` para obtener los porcentajes de `Adopción de nuevas herramientas`, `Flexibilidad al cambio`, etc.

4.  **Generación de Datos de Cabecera:**
    * Rellenará los datos del `header`: `empresa: "Banco Guayaquil"`, `fechaDiagnostico: (fecha actual)`, `empleadosEvaluados: 2402`.

Al final de esta fase, el algoritmo tendrá un objeto estructurado con todos los valores numéricos necesarios para el JSON.

---

#### **Fase 3: Módulo de Análisis Cualitativo (Generación Comprensiva de Narrativas por IA)**

En esta fase, la IA generativa crea todos los textos analíticos y narrativas del reporte. Esto se logrará a través de una serie de prompts específicos y dirigidos, utilizando los datos de la Fase 2 como contexto.

1.  **Análisis de Sentimiento y Temas (Respuestas Abiertas):**
    *   Se agruparán las respuestas a preguntas abiertas (ej. `D3_OPEN`).
    *   Un prompt inicial analizará estas respuestas para identificar temas recurrentes, sentimiento general y extraer citas o frases clave. Este análisis enriquecerá los prompts posteriores.

2.  **Generación de Textos por Sección (Multi-Prompt):**
    *   El algoritmo no usará un único prompt monolítico. En su lugar, ejecutará una secuencia de llamadas a la IA, cada una diseñada para generar el texto de una sección específica del reporte.
    *   **Contexto para cada prompt:** Cada llamada incluirá los datos cuantitativos relevantes (puntuación general, scores de dimensiones, comparativas, etc.) y los temas extraídos del análisis de respuestas abiertas.

3.  **Textos a Generar:**
    *   **Resumen Ejecutivo:** `resumenGeneral`, listas de `fortalezas` y `oportunidades`.
    *   **Introducción:** `contenido` del párrafo introductorio.
    *   **Brecha Digital:** `textoNivelActual`, `textoOportunidadParrafo`, y los párrafos de análisis (`parrafo1`, `parrafo2`).
    *   **Madurez Digital:** `parrafoIntroductorio`.
    *   **Competencias Digitales:** `descripcionPromedio` y `nivelDesarrollo`.
    *   **Uso de IA:** Descripciones para cada gráfico (`graficos[].descripcion`) y el `resumen` de la sección.
    *   **Cultura Organizacional:** `fraseClave` y `narrativa` para cada tarjeta, y el `insights.resumen`.
    *   **Plan de Acción:** El `resumen` general del plan.

4.  **Ejemplo de Prompt (para la sección de Madurez Digital):**
    *   *"Eres un consultor de transformación digital. Redacta un párrafo introductorio (campo 'parrafoIntroductorio') para la sección de 'Madurez Digital' de un reporte. Datos clave: Puntuación general de la dimensión: {puntuacion_madurez_digital}/10. Componente más fuerte: {nombre_componente_fuerte} ({puntuacion_fuerte}/10). Componente más débil: {nombre_componente_debil} ({puntuacion_debil}/10). Nombre de la empresa: {nombre_empresa}. Enfoca el texto en la situación actual y la oportunidad de crecimiento."*

--- 

#### **Fase 4: Módulo de Ensamblaje y Generación del JSON Final**

Esta es la última etapa, donde se unen los resultados de las fases anteriores.

1.  **Creación de la Plantilla JSON:**
    * El algoritmo utilizará una plantilla que replica la estructura del JSON de Profermaco, pero con marcadores de posición para los datos (ej. `"puntuacionEmpresa": {score_brecha_digital}`).

2.  **Poblado de la Plantilla:**
    * Insertará los datos numéricos de la Fase 2 y los textos generados por la IA de la Fase 3 en los lugares correspondientes de la plantilla.

3.  **Validación y Exportación:**
    * Finalmente, validará que la estructura del archivo sea un JSON correcto y lo guardará.

Con este diseño, tendrás un sistema robusto capaz de generar análisis profundos y personalizados para cualquier empresa, manteniendo la coherencia y la calidad del reporte final.