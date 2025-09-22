import fs from 'fs';
import path from 'path';

const XLSX_PATH = path.join(process.cwd(), 'analisis', 'Baremos Madurez Digital SEP25.xlsx');
const SHARED_STRINGS = 'xl/sharedStrings.xml';
const SHEET1 = 'xl/worksheets/sheet1.xml';
const OUT_JSON = path.join(process.cwd(), 'src', 'scripts', 'baremos.json');

async function unzipFileEntry(zipPath, entry) {
  const { spawnSync } = await import('node:child_process');
  const res = spawnSync('unzip', ['-p', zipPath, entry], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`No se pudo leer ${entry} desde el XLSX: ${res.stderr}`);
  return res.stdout;
}

function parseSharedStrings(xml) {
  const arr = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = re.exec(xml))) {
    const si = m[1];
    const tMatch = si.match(/<t[^>]*>([\s\S]*?)<\/t>/);
    if (tMatch) {
      const text = tMatch[1].replace(/\r?\n/g, ' ').trim();
      arr.push(text);
    } else {
      arr.push('');
    }
  }
  return arr;
}

function colToIndex(col) {
  // e.g., A -> 1, B -> 2, ..., AA -> 27
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n;
}

function parseSheet(xml, shared) {
  const rows = new Map();
  const rowRe = /<row [^>]*r=\"(\d+)\"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const rnum = parseInt(rm[1], 10);
    const content = rm[2];
    const cells = [];
    const cellRe = /<c [^>]*r=\"([A-Z]+)(\d+)\"[^>]*?(?:t=\"([a-z]+)\")?[^>]*>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(content))) {
      const col = cm[1];
      const t = cm[3] || null;
      const inner = cm[4] || '';
      const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
      let val = null;
      if (vMatch) {
        const raw = vMatch[1];
        if (t === 's') {
          const idx = parseInt(raw, 10);
          val = shared[idx] ?? '';
        } else {
          val = raw.includes('.') ? parseFloat(raw) : parseFloat(raw);
          if (Number.isNaN(val)) val = raw;
        }
      }
      cells.push({ col, colIdx: colToIndex(col), val });
    }
    rows.set(rnum, cells);
  }
  return rows;
}

function findCellsByText(rows, text) {
  const hits = [];
  for (const [rnum, cells] of rows) {
    for (const c of cells) {
      if (typeof c.val === 'string' && c.val.trim() === text) hits.push({ r: rnum, c: c.colIdx });
    }
  }
  return hits;
}

function extractRangesNear(rows, startRow, windowRows = 12) {
  const out = [];
  for (let r = startRow; r <= startRow + windowRows; r++) {
    const cells = rows.get(r) || [];
    const nums = cells.map(x => x.val).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (nums.length >= 2) {
      // heurística: tomar los extremos menor/mayor en la fila como par Desde/Hasta
      const desde = Math.min(...nums);
      const hasta = Math.max(...nums);
      if (hasta >= desde && (out.length === 0 || Math.abs(out[out.length - 1].desde - desde) > 0.001)) {
        out.push({ desde: +desde.toFixed(2), hasta: +hasta.toFixed(2) });
      }
    }
    if (out.length >= 3) break;
  }
  return out;
}

function labelizeRanges(ranges) {
  const labels = ['Inicial', 'En desarrollo', 'Avanzado'];
  return ranges.slice(0, 3).map((r, i) => ({ nivel: labels[i] || `Nivel ${i+1}`, ...r }));
}

async function main() {
  try {
    if (!fs.existsSync(XLSX_PATH)) throw new Error(`No existe XLSX en ${XLSX_PATH}`);
    const sharedXml = await unzipFileEntry(XLSX_PATH, SHARED_STRINGS);
    const sheetXml = await unzipFileEntry(XLSX_PATH, SHEET1);
    const shared = parseSharedStrings(sharedXml);
    const rows = parseSheet(sheetXml, shared);

    // Cargar baremos existente para actualizar segmentos
    const baremosPath = OUT_JSON;
    const baremos = JSON.parse(fs.readFileSync(baremosPath, 'utf8'));

    // General D1-D4 (si se desea validar/actualizar)
    const generalTitles = [
      'D1 - Población General',
      'D2 - Población General',
      'D3 - Población General',
      'D4 - Población General',
    ];
    const dimMap = {
      'D1 - Población General': 'madurezDigital',
      'D2 - Población General': 'brechaDigital',
      'D3 - Población General': 'culturaOrganizacional',
      'D4 - Población General': 'usoInteligenciaArtificial',
    };
    for (const title of generalTitles) {
      const hits = findCellsByText(rows, title);
      if (hits.length) {
        const r0 = hits[0].r + 2; // saltar filas de encabezado locales
        const ranges = extractRangesNear(rows, r0, 12);
        if (ranges.length >= 3) {
          baremos.general[dimMap[title]] = labelizeRanges(ranges);
        }
      }
    }

    // Roles (D1 y D4)
    const roleMap = [
      { title: 'D1 para Comercial + Operaciones + Liderazgo + RRHH', target: ['roles','D1','comercial_operaciones_liderazgo_rrhh'] },
      { title: 'D1 para Técnico/Producto + Mandos Medios', target: ['roles','D1','tecnico_producto_mandos_medios'] },
      { title: 'D1 para "Otro"', target: ['roles','D1','otro'] },
      { title: 'D4 - Técnico/Producto + Soporte Interno + Mandos medios + Liderazgo', target: ['roles','D4','tecnico_soporte_mandos_liderazgo'] },
      { title: 'D4 - Comercial/Cliente + Operaciones/Finanzas + Otros', target: ['roles','D4','comercial_operaciones_otros'] },
    ];
    for (const rdef of roleMap) {
      const hits = findCellsByText(rows, rdef.title);
      if (hits.length) {
        const r0 = hits[0].r + 2;
        const ranges = extractRangesNear(rows, r0, 12);
        if (ranges.length >= 3) {
          const lvls = labelizeRanges(ranges);
          let node = baremos;
          for (let i = 0; i < rdef.target.length - 1; i++) node = node[rdef.target[i]];
          node[rdef.target[rdef.target.length - 1]] = lvls;
        }
      }
    }

    // Educación (D4)
    const eduMap = [
      { title: 'D4 - Secundaria', target: ['educacion','D4','secundaria'] },
      { title: 'D4 - Técnico/Tecnológico', target: ['educacion','D4','tecnico_tecnologico'] },
      { title: 'D4 - Universitaria', target: ['educacion','D4','universitaria'] },
      { title: 'D4 - Posgrado', target: ['educacion','D4','posgrado'] },
    ];
    for (const ed of eduMap) {
      const hits = findCellsByText(rows, ed.title);
      if (hits.length) {
        const r0 = hits[0].r + 2;
        const ranges = extractRangesNear(rows, r0, 12);
        if (ranges.length >= 3) {
          const lvls = labelizeRanges(ranges);
          let node = baremos;
          for (let i = 0; i < ed.target.length - 1; i++) node = node[ed.target[i]];
          node[ed.target[ed.target.length - 1]] = lvls;
        } else if (ed.title.includes('Universitaria')) {
          // Universitaria: puede heredar de general
          let node = baremos;
          for (let i = 0; i < ed.target.length - 1; i++) node = node[ed.target[i]];
          if (!Array.isArray(node[ed.target[ed.target.length - 1]])) {
            node[ed.target[ed.target.length - 1]] = null;
          }
        }
      }
    }

    baremos.version = new Date().toISOString().slice(0,10);
    baremos.status = 'generated';

    fs.writeFileSync(baremosPath, JSON.stringify(baremos, null, 2), 'utf8');
    console.log(`✅ Baremos actualizados en ${baremosPath}`);
  } catch (e) {
    console.error(`❌ Error al construir baremos: ${e.message}`);
    process.exit(1);
  }
}

await main();
