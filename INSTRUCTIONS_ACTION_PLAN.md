¡Por supuesto! Aquí tienes un prompt claro y técnico, listo para ser entregado a un agente de IA para codificación.

---

### **Prompt para Agente de IA de Codificación**

**Rol:** Eres un desarrollador experto en backend encargado de evolucionar un sistema de recomendación de planes de acción para empleados. El sistema actual genera planes basados en un catálogo de acciones en formato JSON, que se construye a partir de tablas Markdown.

**Objetivo Principal:** Modificar la estructura de datos y la lógica del motor de recomendación para incorporar la **aspiración profesional** del empleado como un factor clave en la generación de su plan de acción.

---

### **Tareas a Realizar**

#### 1. Actualizar el Esquema de Datos (`action_catalog.schema.json`)

Modifica el esquema JSON para incluir un nuevo campo en cada objeto de acción.

* **Nuevo Campo:** `rutaDeCarrera`
* **Tipo:** Array de strings (`string[]`).
* **Descripción:** "Este campo enumera los roles, áreas o competencias futuras que esta acción ayuda a desarrollar. Se utilizará para alinear las acciones con las aspiraciones de carrera de un empleado".
* **Ejemplo de valor:** `["liderazgo", "mandos", "gestion_producto"]`

#### 2. Actualizar el Script `builder`

El script que convierte las tablas Markdown a `action_catalog.json` debe ser modificado para reconocer y procesar la nueva columna `rutaDeCarrera` en las tablas. Asegúrate de que el contenido se parsee correctamente como un array de strings a partir de un texto separado por comas.

#### 3. Ampliar el Catálogo de Acciones (`action_catalog.json`)

Agrega más acciones para que el catálogo sea robusto.

#### 4. Modificar la Lógica del Motor de Recomendación

Esta es la tarea más crítica. El script que genera el plan de acción debe ser refactorizado.

* **Nuevos Parámetros de Entrada:** La función o servicio de recomendación ahora debe aceptar un parámetro adicional: `aspiracionProfesional` (string).
* **Nueva Lógica de Filtrado:** El algoritmo debe realizar una selección multifactorial:
  1. **Filtro por Oportunidad:** Continuar filtrando acciones que correspondan a la dimensión de mayor oportunidad del empleado (ej. `usoInteligenciaArtificial`).
  2. **Filtro por Aspiración:** Implementar un **nuevo filtro** que seleccione acciones donde el array `rutaDeCarrera` contenga un valor que coincida con la `aspiracionProfesional` del empleado.
  3. **Combinación y Priorización:** El resultado final debe ser una lista combinada y priorizada de acciones. Debe incluir:
     * Acciones que cierran su brecha de habilidad actual (Filtro 1).
     * Acciones que lo impulsan hacia su rol futuro (Filtro 2).
     * Acciones que cumplan ambas condiciones tendrán la máxima prioridad.

---

### **Caso de Uso para Validación**

Para validar tu implementación, utiliza el siguiente escenario:

* **Input del Empleado:**
  * `areaOportunidad`: "usoInteligenciaArtificial"
  * `aspiracionProfesional`: "Product Manager" (el sistema debe poder mapear esto a `gestion_producto`)
* **Lógica Esperada:**
  1. El sistema busca acciones en la dimensión `usoInteligenciaArtificial`.
  2. El sistema busca en **todo el catálogo** acciones donde `rutaDeCarrera` incluya `gestion_producto`.
  3. El sistema busca acciones de `Desarrollo de Carrera` que sean relevantes.
* **Output Esperado (Ejemplo):** Un plan que incluya IDs como `IA-01` (porque se relaciona con IA y `gestion_producto`), `DC-02` (para ganar experiencia práctica) y `DC-03` (para mentoring).

Por favor, implementa estos cambios asegurando que el código sea modular y esté bien documentado.
