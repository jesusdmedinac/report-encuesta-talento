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
  const deciles = b?.deciles?.[scope]?.[dimensionKey];
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
