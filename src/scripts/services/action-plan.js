import path from 'path';
import { loadJson } from '../utils.js';
import { initializeAiClient } from './ai-analyzer.js';
import { ACTION_PLAN_WEIGHTS, ACTION_DIM_WEIGHTS, TARGETS_10 } from '../config.js';

function normalizeText(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractSignalsFromOpenEnded(openEnded) {
  const texts = [];
  for (const k of Object.keys(openEnded || {})) {
    const arr = openEnded[k] || [];
    for (const t of arr) texts.push(normalizeText(t));
  }
  const all = texts.join(' ');
  // Palabras clave simples; puede ampliarse
  const signals = [];
  const keywords = ['automatiz', 'capacit', 'datos', 'segurid', 'colabor', 'etica', 'prompt', 'cliente', 'proceso', 'innov'];
  for (const k of keywords) if (all.includes(k)) signals.push(k);
  return Array.from(new Set(signals));
}

function roleGroupFromDemographics(demo = {}) {
  const rol = normalizeText(demo.rol || demo.role || '');
  const area = normalizeText(demo.area || '');
  if (!rol) return '';
  if (/(lider|direct|manager|jefe)/.test(rol)) return 'liderazgo';
  if (/(mando|supervisor)/.test(rol)) return 'mandos';
  if (/(tecnic|producto|it|desarroll|dev|soporte)/.test(rol)) return 'tecnico';
  if (/(comercial|cliente|ventas|marketing)/.test(rol)) return 'comercial';
  if (/(operaciones|finanzas|admin)/.test(rol)) return 'operaciones';
  if (/(rrhh|talento|human)/.test(rol)) return 'rrhh';
  // Heurística por área cuando rol es genérico (ej. "ejecutivo")
  if (/(ejecutivo|analista|especialista)/.test(rol)) {
    if (/comercial|ventas|marketing/.test(area)) return 'comercial';
    if (/operaciones|finanzas|admin|contabilidad/.test(area)) return 'operaciones';
    if (/rrhh|talento|human/.test(area)) return 'rrhh';
  }
  return rol.split(/\s+/)[0];
}

function normalizeAspiration(input = '') {
  const s = normalizeText(input);
  if (!s) return '';
  // Mapeo básico de aspiraciones → slugs
  const map = [
    { re: /(product\s*manager|pm|gesti(o|ó)n\s*de\s*producto)/, slug: 'gestion_producto' },
    { re: /(lider|direct|manager|jefe)/, slug: 'liderazgo' },
    { re: /(mando|supervisor)/, slug: 'mandos' },
    { re: /(data|datos|analista\s*de\s*datos|ciencia\s*de\s*datos)/, slug: 'analitica_datos' },
    { re: /(marketing|growth|producto\s*y\s*marketing)/, slug: 'marketing_digital' },
    { re: /(tecnic|it|desarroll|devops|infra)/, slug: 'tecnico' },
    { re: /(comercial|ventas|cliente)/, slug: 'comercial' },
    { re: /(operaciones|finanzas|admin|procesos)/, slug: 'operaciones' },
    { re: /(rrhh|talento|recursos\s*humanos)/, slug: 'rrhh' }
  ];
  for (const m of map) if (m.re.test(s)) return m.slug;
  return s.replace(/\s+/g, '_');
}

export function selectIndividualActionPlan(doc, catalog, { maxIniciativas = 4, aspiracionProfesional = '' } = {}) {
  const dims = ['madurezDigital','brechaDigital','usoInteligenciaArtificial','culturaOrganizacional'];
  const summary = doc?.summary?.dimensions || {};
  const demo = doc?.header?.subject?.demographics || {};
  const roleGroup = roleGroupFromDemographics(demo);
  const signals = extractSignalsFromOpenEnded(doc?.openEnded || {});
  const aspirationSlug = normalizeAspiration(aspiracionProfesional);
  const scores10 = doc?.scores10 || {};

  function worstSubdimensionsFor(dim, topN = 2) {
    try {
      const subs = scores10[dim] || {};
      const pairs = Object.entries(subs).filter(([,v]) => Number.isFinite(v));
      pairs.sort((a,b) => a[1] - b[1]); // asc: menores primero
      return pairs.slice(0, topN).map(([k]) => k);
    } catch { return []; }
  }

  // ranking por gap10 descendente
  const ranked = dims
    .map(d => ({ dim: d, gap: summary[d]?.gap10 ?? 0 }))
    .filter(x => Number.isFinite(x.gap) && x.gap > ACTION_PLAN_WEIGHTS.minGap)
    .sort((a, b) => b.gap - a.gap);

  const primaryDim = ranked[0]?.dim;
  const secondaryDim = ranked[1]?.dim;
  const iniciativas = [];

  function buildCriteriaDescription() {
    const parts = [];
    const dimWeights = ACTION_DIM_WEIGHTS || {};
    const w = ACTION_PLAN_WEIGHTS || {};
    const gapsTxt = ranked.map(g => `${g.dim} (gap=${(g.gap ?? 0).toFixed(2)})`).join(', ');
    parts.push(`Selección multifactorial con tope de ${maxIniciativas} iniciativas.`);
    if (ranked.length) parts.push(`Prioridad por brecha (gap10) y peso por dimensión: ${gapsTxt}. Pesos: ${JSON.stringify(dimWeights)}.`);
    if (roleGroup) parts.push(`Bono por afinidad de rol ('rolesPreferidos' incluye '${roleGroup}'): +${w.roleBonus ?? 0}.`);
    if (signals.length) parts.push(`Bono por señales de abiertas (coincidencia 'tags' vs ${signals.join(', ')}): +${w.signalsBonus ?? 0}.`);
    if (aspirationSlug) parts.push(`Bono por aspiración profesional ('rutaDeCarrera' incluye '${aspirationSlug}'): +${w.aspirationBonus ?? 0.6}.`);
    parts.push(`Bono por subdimensiones objetivo si cubre las peores (top-2) de la dimensión: +${w.subsBonus ?? 0}.`);
    parts.push(`Heurística de impacto/esfuerzo: impacto alto (+${w.impactHigh ?? 0}), medio (+${w.impactMedium ?? 0}); esfuerzo alto (${w.effortHighPenalty ?? 0}), esfuerzo bajo (+${w.effortLowBonus ?? 0}).`);
    parts.push(`Enriquecimiento de KPIs/OKRs: si aplica, se asigna métrica a la peor subdimensión cubierta y objetivo como max(actual+${w.kpiMinIncrement ?? 0.5}, target10).`);
    if (aspirationSlug) parts.push(`Complemento transversal: si sobran cupos, se agregan acciones de cualquier dimensión alineadas a la aspiración ('rutaDeCarrera'~='${aspirationSlug}').`);
    parts.push(`Fallback sin brechas: se proponen 1–2 KPIs relevantes guiados por señales.`);
    return parts.join(' ');
  }

  function scoreItem(dim, item) {
    let s = Number(summary[dim]?.gap10 || 0);
    const roles = Array.isArray(item.rolesPreferidos) ? item.rolesPreferidos.map(normalizeText) : [];
    if (roleGroup && roles.some(r => roleGroup.includes(r))) s += ACTION_PLAN_WEIGHTS.roleBonus;
    const tags = Array.isArray(item.tags) ? item.tags.map(normalizeText) : [];
    if (signals.length && tags.some(t => signals.some(sig => t.includes(sig)))) s += ACTION_PLAN_WEIGHTS.signalsBonus;
    const rutas = Array.isArray(item.rutaDeCarrera) ? item.rutaDeCarrera.map(normalizeText) : [];
    if (aspirationSlug && rutas.some(r => r.includes(aspirationSlug))) s += (ACTION_PLAN_WEIGHTS.aspirationBonus || 0.6);
    // Afinar por subdimensiones: bonus si el ítem apunta a subdimensiones con peor score
    const worst = worstSubdimensionsFor(dim, 2);
    const targetSubs = Array.isArray(item.subdimensiones) ? item.subdimensiones.map(normalizeText) : [];
    if (worst.length && targetSubs.length) {
      const hit = targetSubs.some(t => worst.some(w => t.includes(normalizeText(w))));
      if (hit) s += ACTION_PLAN_WEIGHTS.subsBonus;
    }
    const impacto = normalizeText(item.impacto);
    const esfuerzo = normalizeText(item.esfuerzo);
    if (impacto.includes('alto')) s += ACTION_PLAN_WEIGHTS.impactHigh; else if (impacto.includes('medio')) s += ACTION_PLAN_WEIGHTS.impactMedium;
    if (esfuerzo.includes('alto')) s += ACTION_PLAN_WEIGHTS.effortHighPenalty; else if (esfuerzo.includes('bajo')) s += ACTION_PLAN_WEIGHTS.effortLowBonus;
    // Peso relativo por dimensión
    const dw = Number(ACTION_DIM_WEIGHTS?.[dim] || 1.0);
    s *= dw;
    return s;
  }

  // Fallback sin brechas: intentar sugerir 1–2 KPIs relevantes por señales, si existen
  if (ranked.length === 0) {
    const anyDims = [...dims];
    const kpis = [];
    for (const d of anyDims) {
      const pool = Array.isArray(catalog?.[d]) ? catalog[d] : [];
      const matches = pool.filter(it => (it.type || '').toUpperCase() === 'KPI');
      const scored = matches.map(it => ({ it, s: scoreItem(d, it) })).sort((a,b)=>b.s-a.s).map(x=>x.it);
      for (const it of scored) { if (kpis.length < maxIniciativas) kpis.push(it); }
      if (kpis.length >= Math.max(1, maxIniciativas-1)) break;
    }
    const enriched = kpis.length ? kpis : [];
    return {
      resumenGeneral: 'Sin brechas relevantes sobre el umbral; se sugieren acciones de mantenimiento y mejora continua.',
      criterios: { top_gaps: ranked, role: roleGroup || null, signals_from_open_ended: signals },
      iniciativas: enriched
    };
  }

  // 1) OKR para la peor dimensión (si existe)
  if (primaryDim) {
    const pool = Array.isArray(catalog?.[primaryDim]) ? catalog[primaryDim] : [];
    const okrs = pool.filter(it => (it.type || '').toUpperCase() === 'OKR');
    const candidates = (okrs.length ? okrs : pool)
      .map(it => ({ it, s: scoreItem(primaryDim, it) }))
      .sort((a, b) => b.s - a.s)
      .map(x => ({ ...x.it }));
    if (candidates[0]) iniciativas.push(candidates[0]);
  }

  // 2) KPIs tácticos como quick wins, priorizando la segunda dimensión y luego el resto
  const dimsForKpi = [secondaryDim, primaryDim, ...dims.filter(d => d !== primaryDim && d !== secondaryDim)].filter(Boolean);
  for (const d of dimsForKpi) {
    if (iniciativas.length >= maxIniciativas) break;
    const pool = Array.isArray(catalog?.[d]) ? catalog[d] : [];
    const kpis = pool.filter(it => (it.type || '').toUpperCase() === 'KPI');
    const base = (kpis.length ? kpis : pool)
      .map(it => ({ it, s: scoreItem(d, it) }))
      .sort((a, b) => b.s - a.s)
      .map(x => ({ ...x.it }));
    for (const cand of base) {
      if (iniciativas.length >= maxIniciativas) break;
      // Evitar duplicados por id
      if (!iniciativas.some(i => i.id === cand.id)) iniciativas.push(cand);
    }
  }

  // Incluir matches por aspiración profesional de cualquier dimensión si quedan cupos
  if (aspirationSlug && iniciativas.length < maxIniciativas) {
    const allDims = Object.keys(catalog || {});
    const pool = [];
    for (const d of allDims) {
      const arr = Array.isArray(catalog[d]) ? catalog[d] : [];
      for (const it of arr) {
        const rutas = Array.isArray(it.rutaDeCarrera) ? it.rutaDeCarrera.map(normalizeText) : [];
        if (rutas.some(r => r.includes(aspirationSlug))) {
          pool.push({ d, it, s: scoreItem(d, it) });
        }
      }
    }
    pool.sort((a,b)=>b.s-a.s);
    for (const cand of pool.map(p => p.it)) {
      if (iniciativas.length >= maxIniciativas) break;
      if (!iniciativas.some(i => i.id === cand.id)) iniciativas.push({ ...cand });
    }
  }

  // Limitar total
  // Enriquecer KRs/KPIs con subdimensiones y targets cuando apliquen
  function enrich(items) {
    const out = [];
    for (const it of items) {
      const dim = primaryDim && it.id?.startsWith(primaryDim.slice(0,2).toUpperCase()) ? primaryDim :
                  secondaryDim && it.id?.startsWith(secondaryDim.slice(0,2).toUpperCase()) ? secondaryDim : null;
      const dimKey = dim || primaryDim || secondaryDim || dims[0];
      const subs = Array.isArray(it.subdimensiones) ? it.subdimensiones.map(normalizeText) : [];
      const worst = worstSubdimensionsFor(dimKey, 2);
      if ((it.type || '').toUpperCase() === 'KPI' && subs.length) {
        // Elegir la peor subdimensión cubierta por el ítem
        const match = worst.find(w => subs.some(su => su.includes(normalizeText(w))));
        const metric = match || subs[0];
        const current = Number(scores10?.[dimKey]?.[metric] || summary[dimKey]?.current10 || 0);
        const target = Math.max(current + 0.5, Number(summary[dimKey]?.target10 || 8.0));
        out.push({ ...it, metric, target: `${target.toFixed(1)}/10` });
        continue;
      }
      if ((it.type || '').toUpperCase() === 'OKR' && subs.length) {
        const krs = [];
        for (const sub of worst.slice(0, 2)) {
          const current = Number(scores10?.[dimKey]?.[sub] || summary[dimKey]?.current10 || 0);
          const target = Math.max(current + 0.5, Number(summary[dimKey]?.target10 || 8.0));
          krs.push({ metric: sub, target: `${target.toFixed(1)}/10` });
        }
        out.push({ ...it, key_results: (it.key_results && it.key_results.length ? it.key_results : krs) });
        continue;
      }
      out.push(it);
    }
    return out;
  }

  const limited = enrich(iniciativas).slice(0, maxIniciativas);

  const resumenDims = [primaryDim, secondaryDim].filter(Boolean).map(d => `${d}: gap ${summary[d]?.gap10}`).join(' · ');
  const plan = {
    resumenGeneral: `Plan priorizado según brechas principales — ${resumenDims}.`,
    criteriosDescripcion: buildCriteriaDescription(),
    criterios: {
      top_gaps: ranked,
      role: roleGroup || null,
      signals_from_open_ended: signals,
      aspiracionProfesional: aspiracionProfesional || null,
      aspiracion_slug: aspirationSlug || null
    },
    iniciativas: limited
  };

  return plan;
}

export function loadActionCatalog() {
  const p = path.join(process.cwd(), 'src', 'scripts', 'action_catalog.json');
  return loadJson(p) || {};
}

export async function maybeRewriteActionPlan(plan, doc, { provider = 'openai', model = 'gpt-4o' } = {}) {
  try {
    if (!plan || !provider) return plan;
    const { aiClient, effectiveModelName } = initializeAiClient(provider, model);
    const context = {
      summary: doc?.summary || {},
      openEnded: doc?.openEnded || {},
      header: { empresa: doc?.header?.empresa || '', subject: doc?.header?.subject || {} }
    };
    const prompt = `Eres un asesor de transformación digital. Reescribe brevemente (tono claro, accionable, sin adjetivos superfluos) el resumen e iniciativas del siguiente plan de acción individual. Mantén exactamente la misma estructura JSON y los mismos campos; solo edita los textos de 'resumenGeneral' y 'descripcion'.
Contexto (resumen): ${JSON.stringify(context)}
Plan actual: ${JSON.stringify(plan)}
Devuelve únicamente JSON válido con las mismas claves, en español.`;

    let text = '';
    if (provider === 'gemini') {
      const res = await aiClient.generateContent(prompt);
      text = await res.response.text();
    } else if (provider === 'openai') {
      const res = await aiClient.chat.completions.create({
        model: effectiveModelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      text = res.choices?.[0]?.message?.content || '';
    }
    try {
      const parsed = JSON.parse(text);
      // Validar que al menos existan los mismos campos base
      if (parsed && typeof parsed === 'object' && parsed.iniciativas && parsed.resumenGeneral) {
        return { ...plan, ...parsed };
      }
    } catch {
      // Ignorar y devolver original
    }
    return plan;
  } catch (e) {
    // Sin claves o error de red: volver al plan original
    return plan;
  }
}
