import fs from 'fs';
import path from 'path';
import { loadJson } from './utils.js';

const ANALYSIS_PATH = path.join(process.cwd(), 'src', 'data', 'analysisScores.json');
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PROVIDERS = ['gemini', 'openai'];

const DIMENSION_LABELS = {
  madurezDigital: 'Madurez Digital',
  brechaDigital: 'Competencias Digitales',
  usoInteligenciaArtificial: 'Uso de IA',
  culturaOrganizacional: 'Cultura Digital',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toFixed(value, decimals = 2) {
  return parseFloat(value.toFixed(decimals));
}

function scaleArrayToTarget(baseValues, targetBase) {
  if (!Array.isArray(baseValues) || baseValues.length === 0) {
    return [];
  }
  if (!Number.isFinite(targetBase)) {
    targetBase = 0;
  }
  const currentAvg = baseValues.reduce((acc, val) => acc + val, 0) / baseValues.length;
  let scaled = [];
  if (currentAvg === 0) {
    scaled = baseValues.map(() => targetBase);
  } else {
    const factor = targetBase / currentAvg;
    scaled = baseValues.map(value => clamp(value * factor, 0, 4));
  }
  const newAvg = scaled.reduce((acc, val) => acc + val, 0) / scaled.length;
  const diff = targetBase - newAvg;
  if (Math.abs(diff) > 1e-6) {
    scaled[0] = clamp(scaled[0] + diff, 0, 4);
  }
  return scaled.map(value => toFixed(value, 4));
}

function updateResumenEjecutivo(resumen, analysis) {
  if (!resumen || !analysis) return;
  if (resumen.puntuacionGeneral) {
    resumen.puntuacionGeneral.puntuacion = toFixed(analysis.global.score10, 2);
  }
  if (Array.isArray(resumen.puntuacionesDimensiones)) {
    resumen.puntuacionesDimensiones = resumen.puntuacionesDimensiones.map(item => {
      const dimensionKey = Object.entries(DIMENSION_LABELS).find(([, label]) => label === item.nombre)?.[0];
      if (dimensionKey && analysis.dimensions[dimensionKey]) {
        return { ...item, puntuacion: toFixed(analysis.dimensions[dimensionKey].score10, 2) };
      }
      return item;
    });
  }
}

function updateBrechaDigital(section, analysis) {
  if (!section) return;
  section.puntuacionEmpresa = toFixed(analysis.global.score10, 2);
  if (analysis.sectorReference && Number.isFinite(analysis.sectorReference.globalMean10)) {
    section.puntuacionPromedioSector = toFixed(analysis.sectorReference.globalMean10, 2);
  }
}

function updateMadurez(section, analysisDim) {
  if (!section || !analysisDim) return;
  section.puntuacionGeneral = toFixed(analysisDim.score10, 2);
  if (Array.isArray(section.componentes) && section.componentes.length) {
    const currentBase = section.componentes.map(c => (Number(c.puntuacion) || 0) / 2.5);
    const scaled = scaleArrayToTarget(currentBase, analysisDim.score4);
    section.componentes = section.componentes.map((component, idx) => ({
      ...component,
      puntuacion: toFixed(scaled[idx] * 2.5, 2),
    }));
  }
}

function updateCompetencias(section, analysisDim) {
  if (!section || !analysisDim) return;
  section.promedio = toFixed(analysisDim.score10, 2);
  if (Array.isArray(section.competencias) && section.competencias.length) {
    const currentBase = section.competencias.map(c => (Number(c.score) || 0) / 10 / 2.5);
    const scaled = scaleArrayToTarget(currentBase, analysisDim.score4);
    section.competencias = section.competencias.map((competencia, idx) => ({
      ...competencia,
      score: Math.round(clamp(scaled[idx] * 2.5 * 10, 0, 100)),
    }));
  }
}

function updateUsoIA(section, analysisDim) {
  if (!section || !analysisDim) return;
  if (Array.isArray(section.graficos) && section.graficos.length) {
    const currentBase = section.graficos.map(grafico => ((Number(grafico.porcentaje) || 0) / 100) * 4);
    const scaled = scaleArrayToTarget(currentBase, analysisDim.score4);
    section.graficos = section.graficos.map((grafico, idx) => ({
      ...grafico,
      porcentaje: Math.round(clamp((scaled[idx] / 4) * 100, 0, 100)),
    }));
  }
}

function updateCultura(section, analysisDim) {
  if (!section || !analysisDim) return;
  if (Array.isArray(section.tarjetas) && section.tarjetas.length) {
    const currentBase = section.tarjetas.map(tarjeta => (Number(tarjeta.puntuacion) || 0) / 2.5);
    const scaled = scaleArrayToTarget(currentBase, analysisDim.score4);
    section.tarjetas = section.tarjetas.map((tarjeta, idx) => ({
      ...tarjeta,
      puntuacion: toFixed(scaled[idx] * 2.5, 2),
    }));
  }
}

function updateRoleSpecificScores(roleSection, analysisModules) {
  if (!roleSection || !analysisModules) return;
  for (const [roleKey, subScores] of Object.entries(roleSection)) {
    const analysisEntry = analysisModules[roleKey];
    if (!analysisEntry || !subScores) continue;
    const entries = Object.entries(subScores);
    if (!entries.length) continue;
    const currentBase = entries.map(([, value]) => (Number(value) || 0) / 2.5);
    const scaled = scaleArrayToTarget(currentBase, analysisEntry.score4);
    entries.forEach(([subKey], idx) => {
      subScores[subKey] = toFixed(scaled[idx] * 2.5, 2);
    });
  }
}

function updateHeader(header, analysis) {
  if (!header) return;
  if (analysis.sampleSize) {
    header.empleadosEvaluados = String(analysis.sampleSize);
    if (header.analysis) {
      header.analysis.sampleSize = analysis.sampleSize;
    }
  }
}

function applyUpdates(filePath, analysis) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  No se encontró ${filePath}, se omite.`);
    return;
  }
  const data = loadJson(filePath);

  updateHeader(data.header, analysis);
  updateResumenEjecutivo(data.resumenEjecutivo, analysis);
  updateBrechaDigital(data.brechaDigital, analysis);
  updateMadurez(data.madurezDigital, analysis.dimensions.madurezDigital);
  updateCompetencias(data.competenciasDigitales, analysis.dimensions.brechaDigital);
  updateUsoIA(data.usoInteligenciaArtificial, analysis.dimensions.usoInteligenciaArtificial);
  updateCultura(data.culturaOrganizacional, analysis.dimensions.culturaOrganizacional);
  updateRoleSpecificScores(data.roleSpecificScores, analysis.roleModules);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Actualizado ${filePath}`);
}

function main() {
  const analysis = loadJson(ANALYSIS_PATH);

  PROVIDERS.forEach(provider => {
    const filePath = path.join(DATA_DIR, `globalData.${provider}.json`);
    applyUpdates(filePath, analysis);
  });
}

main();
