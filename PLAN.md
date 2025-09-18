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

En esta fase, la IA generativa crea todos los textos analíticos del reporte. El proceso se divide en dos pasos clave para asegurar la máxima calidad y relevancia.

1.  **Pre-Análisis de Respuestas Abiertas y Generación de Insights:**
    *   El script primero agrupará todas las respuestas de texto de las preguntas abiertas (ej. `D1_OPEN`).
    *   Se ejecutará una **primera llamada a la IA** por cada pregunta abierta. El objetivo de esta llamada es analizar el texto crudo y devolver un objeto JSON estructurado con los `temasClave` recurrentes, el `sentimientoGeneral` y `citasDestacadas` anónimas.
    *   El conjunto de estos análisis se agrupará en un nuevo objeto principal llamado `analisisCualitativo`, que será mostrado directamente en el reporte a través de un nuevo componente dedicado.

2.  **Generación de Narrativas Principales con Contexto Enriquecido:**
    *   Se ejecutará una **segunda y única llamada a la IA** para generar el resto de las secciones del reporte (`resumenEjecutivo`, `introduccion`, `planAccion`, etc.).
    *   El prompt para esta llamada será enriquecido con dos tipos de contexto:
        1.  Los **datos cuantitativos** de la Fase 2 (puntuaciones, promedios).
        2.  Los **insights cualitativos** (temas y citas) generados en el paso anterior.
    *   Se utilizará el **modo JSON** nativo de la API para garantizar una respuesta estructurada y válida.

4.  **Ejemplo de Flujo de Prompts (Conceptual):**
    *   **Prompt 1 (Pre-Análisis):** *"Analiza las siguientes respuestas a la pregunta '...': {respuestas_abiertas_raw}. Devuelve un JSON con las claves `temasClave` (array de strings), `sentimientoGeneral` (string) y `citasDestacadas` (array de 3 strings)."*
    *   **Prompt 2 (Principal):** *"Eres un consultor experto. Basado en los datos cuantitativos {datos_cuantitativos} y los siguientes insights cualitativos {insights_del_paso_anterior}, genera una respuesta JSON con las claves `resumenEjecutivo` (incluyendo fortalezas y oportunidades), `introduccion` y `planAccion` (con iniciativas detalladas). Asegúrate de que tus textos reflejen tanto los números como los temas mencionados por los empleados."*

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