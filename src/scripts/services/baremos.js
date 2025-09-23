import fs from 'fs';
import path from 'path';

function safeLoadJson(p) {
  try {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, 'utf8');
      return JSON.parse(txt);
    }
  } catch (e) {
    console.warn(`[baremos] No se pudo leer ${p}: ${e.message}`);
  }
  return null;
}

const BAREMOS_PATH = path.join(process.cwd(), 'src', 'scripts', 'baremos.json');
const SECTOR_REF_PATH = path.join(process.cwd(), 'src', 'scripts', 'sector_reference.json');

let _cache = { baremos: null, reference: null };

export function loadBaremos() {
  if (_cache.baremos) return _cache.baremos;
  _cache.baremos = safeLoadJson(BAREMOS_PATH);
  return _cache.baremos;
}

export function loadSectorReference() {
  if (_cache.reference) return _cache.reference;
  _cache.reference = safeLoadJson(SECTOR_REF_PATH);
  return _cache.reference;
}

function getNodeByPath(obj, pathStr) {
  if (!obj) return null;
  if (!pathStr || pathStr === 'general') return obj?.general ?? null;
  const parts = String(pathStr).split('.');
  let node = obj;
  for (const p of parts) {
    if (node && Object.prototype.hasOwnProperty.call(node, p)) {
      node = node[p];
    } else {
      return null;
    }
  }
  return node;
}

export function assignLevel(dimensionKey, score10, opts = {}) {
  const b = loadBaremos();
  if (!b || !b.general) return null;
  const ranges = b.general[dimensionKey];
  if (!Array.isArray(ranges)) return null;
  const s = Number(score10);
  for (const r of ranges) {
    if (typeof r.desde === 'number' && typeof r.hasta === 'number') {
      if (s >= r.desde && s <= r.hasta) return r.nivel;
    }
  }
  return null;
}

export function computeSectorTargets({ method = 'advanced_min' } = {}) {
  const b = loadBaremos();
  if (!b || !b.general) return null;
  const dims = ['madurezDigital','brechaDigital','culturaOrganizacional','usoInteligenciaArtificial'];
  const perDim = {};
  for (const d of dims) {
    const ranges = b.general[d];
    if (!Array.isArray(ranges) || ranges.length === 0) continue;
    let target = null;
    if (method === 'advanced_min') {
      const adv = ranges.find(r => (r.nivel || '').toLowerCase().includes('avanz'));
      target = adv?.desde ?? null;
    } else if (method === 'p90') {
      // Sin datos de distribución exacta, intentamos aproximar: tomar inicio del último tramo.
      const last = ranges[ranges.length - 1];
      target = last?.desde ?? null;
    }
    if (typeof target === 'number') perDim[d] = target;
  }
  const vals = Object.values(perDim).filter(Number.isFinite);
  const global = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : null;
  return { method, perDimension: perDim, global };
}

export function mapScoreToBaremadoDecile(dimensionKey, score10, { scope = 'general' } = {}) {
  const b = loadBaremos();
  const scopeNode = getNodeByPath(b?.deciles, scope) || b?.deciles?.general;
  const deciles = scopeNode?.[dimensionKey];
  const s = Number(score10);
  if (Array.isArray(deciles) && Number.isFinite(s)) {
    for (const r of deciles) {
      if (typeof r.desde === 'number' && typeof r.hasta === 'number') {
        if (s >= r.desde && s <= r.hasta) return r.puntaje; // 10..100
      }
    }
  }
  if (Number.isFinite(s)) {
    const clamped = Math.max(0, Math.min(10, s));
    const d = Math.ceil(clamped); // 1..10
    return Math.min(100, Math.max(10, d * 10));
  }
  return 0;
}

export function getDecilesForScope(dimensionKey, { scope = 'general' } = {}) {
  const b = loadBaremos();
  const scopeNode = getNodeByPath(b?.deciles, scope) || b?.deciles?.general;
  const deciles = scopeNode?.[dimensionKey];
  return Array.isArray(deciles) ? deciles : (b?.deciles?.general?.[dimensionKey] || []);
}

function normalizeText(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Heurística inicial: derivar scope desde demographics para D1–D4
export function selectBaremosScope({ subject } = {}, dimensionKey = 'madurezDigital') {
  try {
    const demo = subject?.demographics || {};
    const rol = normalizeText(demo.rol || demo.role || '');
    const edu = normalizeText(demo.nivelEducativo || demo.educacion || '');

    if (dimensionKey === 'madurezDigital') {
      // D1 roles
      if (rol) {
        if (/(tecnico|producto|mandos)/.test(rol)) return 'roles.D1.tecnico_producto_mandos_medios';
        if (/(comercial|cliente|operaciones|finanzas|lider|rrhh|recursos humanos)/.test(rol)) return 'roles.D1.comercial_operaciones_liderazgo_rrhh';
        return 'roles.D1.otro';
      }
      return 'general';
    }

    if (dimensionKey === 'usoInteligenciaArtificial') {
      // Preferir rol D4; si no, usar educación D4
      if (rol) {
        if (/(tecnico|producto|soporte|mandos|lider)/.test(rol)) return 'roles.D4.tecnico_soporte_mandos_liderazgo';
        if (/(comercial|cliente|operaciones|finanzas|otro)/.test(rol)) return 'roles.D4.comercial_operaciones_otros';
      }
      if (edu) {
        if (/secundaria/.test(edu)) return 'educacion.D4.secundaria';
        if (/(tecnico|tecnologico)/.test(edu)) return 'educacion.D4.tecnico_tecnologico';
        if (/universitaria/.test(edu)) return 'educacion.D4.universitaria';
        if (/posgrado/.test(edu)) return 'educacion.D4.posgrado';
      }
      return 'general';
    }

    // D2 y D3: por ahora no hay cortes segmentados → general
    return 'general';
  } catch {
    return 'general';
  }
}
