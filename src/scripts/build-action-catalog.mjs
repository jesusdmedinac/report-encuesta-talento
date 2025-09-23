import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateData } from './services/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MD_PATH = path.join(process.cwd(), 'analisis', 'action_catalog.md');
const OUT_JSON = path.join(process.cwd(), 'src', 'scripts', 'action_catalog.json');

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseTables(md) {
  // Estructura esperada (por sección):
  // ### <dimension>
  // | id | titulo | descripcion | areaEnfoque | prioridad | plazo | rolesPreferidos | tags | rutaDeCarrera | type | subdimensiones |
  // | --- | --- | --- | --- | --- | --- | --- | --- |
  // | IA-01 | ... | ... | ... | Alta | 6-10 semanas | liderazgo, mandos | ia,pilotos |
  const lines = md.split(/\r?\n/);
  const out = {};
  let i = 0;
  let currentDim = null;
  while (i < lines.length) {
    const line = lines[i].trim();
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) {
      currentDim = norm(m[1]).replace(/\s+/g, '');
      if (!out[currentDim]) out[currentDim] = [];
      // Encontrar header y separador
      let h = i + 1;
      while (h < lines.length && !/^\s*\|/i.test(lines[h])) h++;
      if (h + 1 >= lines.length) { i++; continue; }
      const headerLine = lines[h].trim();
      const sep = (lines[h + 1] || '').trim();
      // Detectar fila separadora tipo Markdown (debe contener '|' y guiones)
      if (!(sep.includes('|') && /-+/.test(sep))) { i = h + 1; continue; }

      // Parsear cabecera para ubicar columnas por nombre
      const headerCells = headerLine.split('|').map(s => s.trim().toLowerCase());
      const idx = (name) => headerCells.findIndex(c => c === name);
      const colId = idx('id');
      const colTitulo = idx('titulo');
      const colDesc = idx('descripcion');
      const colArea = idx('areaenfoque');
      const colPrioridad = idx('prioridad');
      const colPlazo = idx('plazo');
      const colRoles = idx('rolespreferidos');
      const colTags = idx('tags');
      const colRutaCarrera = idx('rutadecarrera');
      const colType = idx('type');
      const colSubs = idx('subdimensiones');
      const colObj = idx('objective');
      const colKRs = idx('key_results');
      // Leer filas hasta próxima sección
      let r = h + 2;
      while (r < lines.length && !/^###\s+/.test(lines[r]) && !/^##\s+/.test(lines[r])) {
        const row = lines[r].trim();
        if (!row || !row.startsWith('|')) { r++; continue; }
        const parts = row.split('|').map(s => s.trim());
        const cells = parts; // incluye bordes, por eso usamos los índices de cabecera
        const safe = (ix) => (ix >= 0 && ix < cells.length ? cells[ix] : '').trim();
        const val = (ix) => safe(ix).replace(/^\|+|\|+$/g, '').trim();
        const id = val(colId);
        if (id) {
          const titulo = val(colTitulo);
          const descripcion = val(colDesc);
          const areaEnfoque = val(colArea);
          const prioridad = val(colPrioridad);
          const plazo = val(colPlazo);
          const rolesPref = val(colRoles);
          const tags = val(colTags);
          const rutaCarrera = val(colRutaCarrera);
          const type = val(colType);
          const subs = val(colSubs);
          const objective = val(colObj);
          const krsRaw = val(colKRs);
          let key_results = [];
          if (krsRaw) {
            // Formato esperado: metric:target; metric:target
            key_results = krsRaw.split(';').map(x => x.trim()).filter(Boolean).map(pair => {
              const [metric, target] = pair.split(':').map(s => (s || '').trim());
              const out = {};
              if (metric) out.metric = metric;
              if (target) out.target = target;
              return out;
            }).filter(kr => Object.keys(kr).length > 0);
          }
          out[currentDim].push({
            id, titulo, descripcion, areaEnfoque,
            prioridad,
            plazoEstimado: plazo,
            rolesPreferidos: rolesPref ? rolesPref.split(',').map(s => s.trim()).filter(Boolean) : [],
            tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [],
            ...(rutaCarrera ? { rutaDeCarrera: rutaCarrera.split(',').map(s => s.trim()).filter(Boolean) } : {}),
            ...(type ? { type: type.trim().toUpperCase() } : {}),
            ...(subs ? { subdimensiones: subs.split(',').map(s => s.trim()).filter(Boolean) } : {}),
            ...(objective ? { objective } : {}),
            ...(key_results.length ? { key_results } : {})
          });
        }
        r++;
      }
      i = r; continue;
    }
    i++;
  }
  return out;
}

async function main() {
  try {
    let catalog;
    let provenance;
    if (fs.existsSync(MD_PATH)) {
      const md = fs.readFileSync(MD_PATH, 'utf8');
      catalog = parseTables(md);
      provenance = { file: 'analisis/action_catalog.md', format: 'markdown' };
    } else {
      // Fallback: validar el JSON actual si no existe el MD (modo mantenimiento)
      if (!fs.existsSync(OUT_JSON)) throw new Error(`No existe ${MD_PATH} ni ${OUT_JSON}`);
      catalog = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
      provenance = { file: 'src/scripts/action_catalog.json', format: 'json' };
    }

    // Validar contra esquema
    validateData(catalog, 'action_catalog');

    // Anotar metadatos de versión
    const wrapped = { version: new Date().toISOString().slice(0,10), status: 'built', source: provenance, catalog };
    // Para compatibilidad, escribir solo el catálogo si venimos de MD; si venimos de JSON, reescribir igual estructura
    fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`✅ Catálogo de acciones válido. Escrito en ${OUT_JSON}`);
  } catch (e) {
    console.error(`❌ Error al construir/validar catálogo: ${e.message}`);
    process.exit(1);
  }
}

await main();
