import path from 'path';
import { loadJson } from '../utils.js';
import { MAPPINGS_PATH } from '../config.js';

const DEFAULT_ANALYSIS_PATH = path.join(process.cwd(), 'src', 'data', 'analysisScores.json');

function buildDimensionStructure(mappings) {
  const structure = {};
  for (const question in mappings) {
    const { dimension, subDimension } = mappings[question];
    if (!structure[dimension]) {
      structure[dimension] = new Set();
    }
    structure[dimension].add(subDimension);
  }
  return Object.fromEntries(
    Object.entries(structure).map(([dimension, subDimensions]) => [dimension, Array.from(subDimensions)])
  );
}

function lookupScore(container, key) {
  const entry = container[key];
  if (!entry) return null;
  if (typeof entry.score4 === 'number') return entry.score4;
  if (typeof entry.score10 === 'number') return entry.score10 / 2.5;
  return null;
}

export function loadQuantitativeFromAnalysis(analysisPath = DEFAULT_ANALYSIS_PATH) {
  const analysisData = loadJson(analysisPath);
  const mappings = loadJson(MAPPINGS_PATH);
  const structure = buildDimensionStructure(mappings);

  const analysisResults = {};

  for (const [dimension, subDimensions] of Object.entries(structure)) {
    const sourceBucket = dimension.startsWith('rol') ? analysisData.roleModules || {} : analysisData.dimensions || {};
    const score4 = lookupScore(sourceBucket, dimension);
    if (score4 == null) {
      continue;
    }
    analysisResults[dimension] = {};
    subDimensions.forEach(sub => {
      analysisResults[dimension][sub] = parseFloat(score4.toFixed(4));
    });
  }

  return {
    analysisResults,
    sampleSize: analysisData.sampleSize || 0,
    source: analysisData.source || 'analysisScores.json',
    globalScore: analysisData.global || null,
    sectorReference: analysisData.sectorReference || null,
  };
}
