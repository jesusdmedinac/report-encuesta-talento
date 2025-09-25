# Reporte de Madurez Digital

Este es un proyecto Astro para visualizar un reporte de madurez digital generado automáticamente.

> **Estado SEP25 (en curso):** estamos alineando los datos del reporte con el estudio "Análisis escala Madurez Digital SEP25". Los JSON `globalData.openai.json` y `globalData.gemini.json` se encuentran en proceso de sincronización (puntuación global 7.21, D1=7.19, D2=7.41, D3=6.94, D4=7.07, benchmark 6.75). Las secciones de Uso de IA y Cultura recibirán ajustes visuales y se añadirá una página dedicada al análisis con los gráficos de `analisis/graphs`.

## 📊 Página de análisis SEP25

- Nueva ruta: `/analisis/sep25` (también accesible desde la portada).
- Contiene resumen ejecutivo, métricas por dimensión y galería de gráficos generados en el estudio.
- Las imágenes y notas se leen automáticamente desde `analisis/graphs/*.png|.md`, por lo que cualquier actualización en esa carpeta se refleja en la UI.
- Pensada como referencia confiable cuando se requiera verificar cifras del PDF o compartir resultados con stakeholders.

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

## 👤 Reportes individuales (proceso independiente)

Además del reporte global, se puede generar un reporte por empleado sin afectar el flujo existente. Este proceso es independiente y escribe un JSON por persona que luego puede visualizarse en rutas separadas.

Principios:
- Privacidad primero: no se incluye PII en la salida (sin nombre/email). Se usa un `employeeId` pseudónimo.
- Por defecto sin IA (offline) para ser económico y rápido; se puede habilitar IA por demanda con `--ai`.
- Control de volumen: filtra por `--ids` o `--limit` para no procesar toda la base si no es necesario.

Salida esperada:
- `src/data/individual/<employeeId>.json` con: `header` (empresa, employeeId, generatedAt, provider/model/mode), `scores` por dimensión/subdimensión y `openEnded` del propio empleado (limpias/anonimizadas).

CLI (implementado en `src/scripts/generate-individual-reports.mjs`):
```bash
# Generar un subconjunto (p. ej. 5 primeros) para validar
npm run generate-individual -- \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Skilt" \
  --limit=5

# Generar un subconjunto por IDs conocidos
npm run generate-individual -- \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Skilt" \
  --ids=emp_01,emp_07,emp_42 \
  --offline

# Generar todos (eleva el límite explícitamente)
npm run generate-individual -- \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Skilt" \
  --limit=99999
```

Notas operativas:
- Identificador: por defecto se usa un `employeeId` determinístico (hash) derivado de un campo estable (p.ej. email). La salida nunca expone ese campo.
- Límite por defecto: el generador procesa 1 reporte si no se indica `--limit`. Ajusta `--limit` o usa `--ids`.
- Futuro: caché cualitativo por empleado: `src/data/ind-openEnded.<employeeId>.json` cuando se use IA.
- Páginas Astro: se expondrán rutas separadas, p.ej. `/empleados/<employeeId>` y un índice `/empleados/` con los disponibles.

## 🔎 Listado de respuestas con búsqueda e infinito

Objetivo: ofrecer una página administrativa con un listado de respuestas paginado por scroll infinito y un buscador superior que filtre indistintamente por nombre o correo, normalizando siempre a minúsculas (y sin acentos).

Datos de respaldo:
- Índice ligero en `public/respuestas-index.json` (para servirlo tal cual) con campos mínimos:
  - `nombreCompleto`, `email` (en claro; el sitio ya está protegido por auth).
  - `nombreL`, `emailL`: versiones normalizadas (minúsculas/sin acentos) para filtrar rápido en el cliente.
  - Opcional: `area`/`rol` si quieres mostrar columnas adicionales.

CLI (implementado):
```bash
npm run generate-respuestas-index -- \
  --csv=./data/respuestas-por-puntos.csv \
  --out=public/respuestas-index.json
```

UX/Comportamiento:
- Página en `src/pages/respuestas/index.astro` que:
  - Carga el índice vía `fetch('/respuestas-index.json')`.
  - Normaliza la query a minúsculas (y sin acentos) y filtra contra `nombreL` y `emailL`.
  - Renderiza en lotes de 50–100 ítems con IntersectionObserver (scroll infinito).
  - Debounce de 200–300 ms para búsquedas.
  - Enlaza cada fila a `/empleados/{id}`.

Detalle individual:
- `src/pages/empleados/[id].astro` carga `src/data/individual/{id}.json` y visualiza puntajes y abiertas.
- El `id` proviene de la columna `#` del CSV (fallback a hash determinístico si no existe).

Contrato y próximos incrementos (inspirado en PRESEDENT_REPORT.md):
- Próximamente el JSON individual incluirá metadatos (`schema_version`, `generated_at`, `provenance`) y comparativos mínimos:
  - Valores normalizados a 1–10 (conservar crudos 1–4 para trazabilidad).
  - Promedio colectivo por dimensión (`collective_average10`).
  - Metas por dimensión desde `config.js` y brecha (`gap10`).
  - Percentil general por dimensión.
  - Narrativa breve y `action_plan` por reglas deterministas.

Privacidad y cacheo:
- El sitio ya requiere auth; aun así, añade `<meta name="robots" content="noindex">` en la página.
- Configura `Cache-Control: private, no-store` para el JSON de índice en el hosting si es factible.

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
      --csv=./data/respuestas-por-puntos.csv \
      --empresa="Skilt" \
      --reportId="SKL-001" \
      --provider=gemini \
      --model="gemini-2.5-pro"
    
    # Generar reporte con OpenAI
    npm run generate-report -- \
      --csv=./data/respuestas-por-puntos.csv \
      --empresa="Skilt" \
      --reportId="SKL-001" \
      --provider=openai \
      --model="gpt-5"
    ```

### Script Unificado de Generación

Para simplificar la ejecución y evitar duplicación, usa `./generate.sh` y elige el proveedor con `--provider` (o variable `PROVIDER`). Carga `.env` automáticamente y valida precondiciones. Los scripts anteriores (`generate-gemini.sh` y `generate-openai.sh`) fueron reemplazados por este comando unificado.

Ejemplos:

```bash
# Gemini por defecto
./generate.sh --provider=gemini \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Banco de Guayaquil" \
  --reportId="TBjwOGHs" \
  --model="gemini-2.5-pro"

# OpenAI (mantiene gpt-5 por defecto si no se pasa --model)
./generate.sh --provider=openai \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Banco de Guayaquil" \
  --reportId="TBjwOGHs" \
  --model="gpt-5"

# Refrescar caché de abiertas antes de generar
REFRESH_OPEN_ENDED=1 ./generate.sh --provider=gemini --refresh-open-ended

# Usar variables de entorno para defaults
CSV_PATH=./data/respuestas-por-puntos.csv \
EMPRESA="Banco de Guayaquil" \
REPORT_ID=TBjwOGHs \
MODEL=gemini-2.5-pro \
./generate.sh --provider=gemini

# Modo offline (sin llamadas a IA, más rápido)
./generate.sh --provider=gemini --offline
```

3.  **Verifica el resultado**:
    El script creará un nuevo archivo de datos en `src/data/`, nombrado según el proveedor (ej. `globalData.gemini.json`). La página del reporte utilizará estos datos para renderizar la visualización actualizada.

Indicadores en la interfaz:
- El `Header` muestra `provider`, `model` y `generationMode` (online, online-degraded, offline).
- `AnalisisCualitativo` muestra un badge “offline” si el caché de abiertas fue generado sin IA.

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
- En caso de error de parseo o validación del esquema, el sistema siempre guarda artefactos de depuración en `./debug/`:
  - `ai-response.parse-failed.<provider>.<timestamp>.raw.txt` y `.sanitized.json`
  - `ai-response.failed.<provider>.<timestamp>.raw.txt` y `.sanitized.json` (cuando no pasa la validación)
  - Cada uno incluye un `.error.txt` con el detalle del fallo.

### Variables de Entorno y Flags

- Variables de entorno soportadas:
  - `GEMINI_API_KEY` / `OPENAI_API_KEY`: claves para proveedores de IA.
  - `CSV_PATH`, `EMPRESA`, `REPORT_ID`, `MODEL`, `PROVIDER`: valores por defecto para `./generate.sh`.
  - `DEBUG_AI`: si es `1`, guarda las respuestas crudas de IA.
  - `AI_MAX_RETRIES`: número de reintentos ante errores transitorios de IA (por defecto `3`).
  - `AI_RETRY_BASE_MS`: retardo base en ms para backoff exponencial (por defecto `800`).

- Flags comunes en `./generate.sh` y/o `npm run generate-report`:
  - `--offline`: no realiza llamadas a IA; usa datos cuantitativos y el caché existente.
  - `--skip-open-ended`: no usa ni genera caché de abiertas.
  - `--refresh-open-ended`: regenera el caché de abiertas antes de generar el reporte.
  - Passthrough: puedes añadir cualquier flag soportado por `generate-report.mjs` tras `./generate.sh`.
