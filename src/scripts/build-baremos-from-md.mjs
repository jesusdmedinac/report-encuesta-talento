import fs from 'fs';
import path from 'path';

const MD_PATH = path.join(process.cwd(), 'analisis', 'baremos.md');
const OUT_JSON = path.join(process.cwd(), 'src', 'scripts', 'baremos.json');

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      const title = h3[1].trim();
      // Seek header row
      let j = i + 1;
      while (j < lines.length && !/^\s*Puntaje\s+baremado\s*\|/i.test(lines[j])) j++;
      if (j >= lines.length) { i++; continue; }
      const header = lines[j];
      const sep = lines[j+1] || '';
      if (!/^-+\s*\|/.test(sep)) { i = j+1; continue; }
      j += 2;
      const rows = [];
      while (j < lines.length) {
        const row = lines[j].trim();
        if (!row || row.startsWith('###') || row.startsWith('##')) break;
        const parts = row.split('|').map(s => s.trim());
        if (parts.length >= 4) {
          const puntaje = parseInt(parts[0], 10);
          const nivel = parts[1];
          const desde = parseFloat(parts[2]);
          const hasta = parseFloat(parts[3]);
          if (!Number.isNaN(desde) && !Number.isNaN(hasta)) {
            rows.push({ puntaje, nivel, desde, hasta });
          }
        }
        j++;
      }
      blocks.push({ title, rows });
      i = j; continue;
    }
    i++;
  }
  return blocks;
}

function compressLevels(rows) {
  const groups = new Map();
  for (const r of rows) {
    const key = norm(r.nivel).toLowerCase();
    if (!groups.has(key)) groups.set(key, { desde: r.desde, hasta: r.hasta, label: r.nivel });
    const g = groups.get(key);
    if (r.desde < g.desde) g.desde = r.desde;
    if (r.hasta > g.hasta) g.hasta = r.hasta;
  }
  const orden = ['inicial','en desarrollo','avanzado'];
  return orden
    .filter(k => groups.has(k))
    .map(k => {
      const g = groups.get(k);
      return { nivel: g.label, desde: g.desde, hasta: g.hasta };
    });
}

function mapTitleToPath(title) {
  const t = norm(title).toLowerCase();
  // General
  if (t.includes('poblacion general')) {
    if (t.startsWith('d1')) return ['general','madurezDigital'];
    if (t.startsWith('d2')) return ['general','brechaDigital'];
    if (t.startsWith('d3')) return ['general','culturaOrganizacional'];
    if (t.startsWith('d4')) return ['general','usoInteligenciaArtificial'];
  }
  // Roles D1
  if (t.startsWith('d1 para')) {
    if (t.includes('comercial') && t.includes('operaciones') && t.includes('liderazgo')) return ['roles','D1','comercial_operaciones_liderazgo_rrhh'];
    if (t.includes('tecnico/producto') && t.includes('mandos medios')) return ['roles','D1','tecnico_producto_mandos_medios'];
    if (t.includes('otro')) return ['roles','D1','otro'];
  }
  // Roles D4
  if (t.startsWith('d4 -')) {
    if (t.includes('tecnico/producto') && t.includes('soporte interno') && t.includes('mandos medios') && t.includes('liderazgo')) return ['roles','D4','tecnico_soporte_mandos_liderazgo'];
    if (t.includes('comercial/cliente') && t.includes('operaciones/finanzas') && t.includes('otros')) return ['roles','D4','comercial_operaciones_otros'];
  }
  // Educación D4
  if (t.startsWith('d4 -')) {
    if (t.includes('secundaria')) return ['educacion','D4','secundaria'];
    if (t.includes('tecnico/tecnologico')) return ['educacion','D4','tecnico_tecnologico'];
    if (t.includes('universitaria')) return ['educacion','D4','universitaria'];
    if (t.includes('posgrado')) return ['educacion','D4','posgrado'];
  }
  return null;
}

async function main() {
  try {
    if (!fs.existsSync(MD_PATH)) throw new Error(`No existe markdown en ${MD_PATH}`);
    const md = fs.readFileSync(MD_PATH, 'utf8');
    const blocks = parseMarkdown(md);

    const out = {
      version: new Date().toISOString().slice(0,10),
      status: 'from-md',
      source: { file: 'analisis/baremos.md', format: 'markdown' },
      general: {},
      roles: { D1: {}, D4: {} },
      educacion: { D4: {} },
      targetMethod: 'advanced_min',
      deciles: { general: {}, roles: { D1: {}, D4: {} }, educacion: { D4: {} } }
    };

    for (const b of blocks) {
      const pathArr = mapTitleToPath(b.title);
      if (!pathArr) continue;
      const comp = compressLevels(b.rows);
      // Set compressed (3 niveles)
      let node = out;
      for (let i = 0; i < pathArr.length - 1; i++) node = node[pathArr[i]];
      node[pathArr[pathArr.length - 1]] = comp;
      // Set deciles completos
      let nodeDec = out.deciles;
      for (let i = 0; i < pathArr.length - 1; i++) nodeDec = nodeDec[pathArr[i]];
      nodeDec[pathArr[pathArr.length - 1]] = b.rows
        .filter(r => Number.isFinite(r.puntaje))
        .map(r => ({ puntaje: r.puntaje, nivel: r.nivel, desde: r.desde, hasta: r.hasta }));
    }

    fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');
    console.log(`✅ Baremos generados desde markdown en ${OUT_JSON}`);
  } catch (e) {
    console.error(`❌ Error al construir baremos desde MD: ${e.message}`);
    process.exit(1);
  }
}

await main();
