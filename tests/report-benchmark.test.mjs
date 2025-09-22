import test from 'node:test';
import assert from 'node:assert/strict';

import { generateReportJson } from '../src/scripts/services/report-builder.js';
import { computeSectorTargets } from '../src/scripts/services/baremos.js';
import sectorRef from '../src/scripts/sector_reference.json' assert { type: 'json' };

test('brechaDigital incluye benchmark y meta derivada', () => {
  const analysisResults = {
    madurezDigital: { a: 3.0, b: 3.0, c: 3.0 },
    brechaDigital: { a: 3.0, b: 3.0, c: 3.0 },
    usoInteligenciaArtificial: { a: 3.0, b: 3.0, c: 3.0 },
    culturaOrganizacional: { a: 3.0, b: 3.0, c: 3.0 },
  };
  const qualitativeResults = { brechaDigital: {}, introduccion: '', resumenEjecutivo: {}, madurezDigital: {}, competenciasDigitales: {}, usoInteligenciaArtificial: {}, culturaOrganizacional: {}, planAccion: { iniciativas: [] } };
  const out = generateReportJson(analysisResults, qualitativeResults, 10, 'EmpresaX', 'R1', 'gemini', 'offline', 'offline');

  assert.ok(out.brechaDigital);
  assert.equal(typeof out.brechaDigital.puntuacionEmpresa, 'number');
  assert.equal(typeof out.brechaDigital.puntuacionMetaSector, 'number');
  // Benchmark desde referencia
  assert.equal(out.brechaDigital.puntuacionPromedioSector, sectorRef.globalMean10);

  // Meta esperada: computeSectorTargets().global (redondeo a 2 decimales)
  const t = computeSectorTargets({ method: 'advanced_min' });
  const expected = Number(t.global?.toFixed(2));
  assert.equal(out.brechaDigital.puntuacionMetaSector, expected);

  // Metadatos de análisis en header
  assert.ok(out.header.analysis);
  assert.equal(out.header.analysis.sampleSize, 10);
  assert.ok(out.header.analysis.baremos);
  assert.ok(out.header.analysis.reference);
});
