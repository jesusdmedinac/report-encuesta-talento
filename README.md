# Reporte de Madurez Digital

Este es un proyecto Astro para visualizar un reporte de madurez digital generado automáticamente.

## 🚀 Estructura del Proyecto

```text
/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   │   └── globalData.json
│   ├── layouts/
│   ├── pages/
│   └── scripts/
│       ├── services/
│       │   ├── ai-analyzer.js
│       │   ├── csv-processor.js
│       │   └── report-builder.js
│       ├── config.js
│       ├── generate-report.mjs
│       ├── mappings.json
│       └── utils.js
├── data/
│   └── Csv con respuestas
└── package.json
```

-   **`src/components`**: Componentes de Astro que renderizan cada sección del reporte.
-   **`src/data/globalData.json`**: Corazón del reporte, contiene todos los datos que se muestran. Es generado por el script.
-   **`src/scripts/generate-report.mjs`**: Punto de entrada del script. Orquesta la ejecución de los diferentes módulos.
-   **`src/scripts/services/`**: Módulos con la lógica de negocio principal (análisis de IA, procesamiento de CSV, construcción del reporte).
-   **`src/scripts/config.js`**: Archivo para constantes y configuración del script.

## 🧞 Comandos

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias. |
| `npm run dev` | Inicia el servidor de desarrollo en `localhost:4321`. |
| `npm run build` | Compila el sitio para producción en `./dist/`. |
| `npm run preview` | Previsualiza el sitio compilado. |
| `npm run generate-report` | **Genera un nuevo reporte a partir de un CSV.** |
| `npm run generate-open-ended` | Genera el caché de preguntas abiertas con IA (o modo offline). |

## 🤖 Generación Automática de Reportes

Este proyecto incluye un potente script para procesar los resultados de una encuesta de madurez digital y generar automáticamente el archivo de datos (`globalData.json`) que alimenta el reporte visual.

### Requisitos

1.  **Archivo CSV**: Necesitas un archivo con las respuestas de la encuesta.
2.  **Clave de API de IA**: El script utiliza un modelo de lenguaje grande (Gemini o OpenAI) para generar análisis cualitativos. Debes tener una clave de API.

### Pasos para Generar un Reporte

1.  **Configura las variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto o exporta las variables en tu terminal.

    *   **Para Gemini**:
        ```bash
        export GEMINI_API_KEY="tu_api_key_de_google_ai"
        ```
    *   **Para OpenAI**:
        ```bash
        export OPENAI_API_KEY="tu_api_key_de_openai"
        ```

2.  **Ejecuta el script**:
    Utiliza el comando `npm run generate-report` y pásale los siguientes argumentos:
    *   `--csv`: Ruta al archivo de respuestas.
    *   `--empresa`: Nombre de la empresa para el reporte.
    *   `--reportId`: Un identificador único para el reporte.
    *   `--provider` (opcional): El proveedor de IA a utilizar. Puede ser `gemini` (por defecto) u `openai`.

    **Ejemplos de uso:**
    ```bash
    # Generar reporte con Gemini
    npm run generate-report -- \
      --csv=./data/responses-por-puntos.csv \
      --empresa="Skilt" \
      --reportId="SKL-001" \
      --provider=gemini \
      --model="gemini-2.5-pro"
    
    # Generar reporte con OpenAI
    npm run generate-report -- \
      --csv=./data/responses-por-puntos.csv \
      --empresa="Skilt" \
      --reportId="SKL-001" \
      --provider=openai \
      --model="gpt-5"
    ```

### Scripts de Ayuda

Para facilitar la generación de reportes, se han creado dos scripts que ejecutan los comandos con la configuración predefinida:

-   `./generate-gemini.sh`: Genera el reporte utilizando Gemini.
-   `./generate-openai.sh`: Genera el reporte utilizando OpenAI.

**Uso:**

1.  Asegúrate de haber configurado la variable de entorno correspondiente (`GEMINI_API_KEY` o `OPENAI_API_KEY`).
2.  Otorga permisos de ejecución a los scripts si es necesario:
    ```bash
    chmod +x generate-gemini.sh generate-openai.sh
    ```
3.  Ejecuta el script deseado:
    ```bash
    ./generate-gemini.sh
    ```
    o
    ```bash
    ./generate-openai.sh
    ```

3.  **Verifica el resultado**:
    El script creará un nuevo archivo de datos en `src/data/`, nombrado según el proveedor (ej. `globalData.gemini.json`). La página del reporte utilizará estos datos para renderizar la visualización actualizada.

### Análisis de Preguntas Abiertas (caché reutilizable)

Para controlar costos/tiempo y enriquecer el reporte con insights cualitativos, el pre‑análisis de abiertas se realiza y se cachea por separado:

- Generar caché de abiertas:
  ```bash
  npm run generate-open-ended -- \
    --csv=./data/respuestas-por-puntos.csv \
    --reportId=TBjwOGHs \
    --provider=gemini \
    --model=gemini-1.5-flash \
    --force # opcional, para regenerar
  ```
- El caché se guarda en `src/data/openEnded.<reportId>.json` e incluye:
  - `source`: `{ csvPath, csvHash, rowCount, generatedAt }`
  - `preguntas`: `{ D1_OPEN: { temas[], resumenGeneral, metricaSentimiento, citas[] }, ... }`
  - `resumenGeneral` global

Integración en el generador principal:
- `--skip-open-ended`: omite el uso de abiertas
- `--refresh-open-ended`: regenera el caché antes de generar

Modo offline (sin salida a red):
- Si la IA no está disponible, `generate-open-ended` crea un caché básico a partir de frecuencias y citas (temas/citas neutras), evitando bloquear el flujo.
- En `generate-report`, si la IA falla, el `analisisCualitativo` se incluye desde el caché para que el frontend lo muestre.

Debug de respuestas IA (opcional):
- Establece `DEBUG_AI=1` para guardar las respuestas crudas en `./debug/`.
