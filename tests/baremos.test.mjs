import test from 'node:test';
import assert from 'node:assert/strict';

import { assignLevel, computeSectorTargets } from '../src/scripts/services/baremos.js';
import baremos from '../src/scripts/baremos.json' assert { type: 'json' };

test('assignLevel usa baremo general para niveles por dimensión', () => {
  // D2 (brechaDigital) con rangos comprimidos desde MD
  assert.equal(assignLevel('brechaDigital', 6.1), 'Inicial');
  assert.equal(assignLevel('brechaDigital', 6.5), 'En desarrollo');
  assert.equal(assignLevel('brechaDigital', 8.0), 'Avanzado');

  // D1 (madurezDigital) bordes desde MD
  assert.equal(assignLevel('madurezDigital', 5.2), 'Inicial');
  assert.equal(assignLevel('madurezDigital', 5.21), 'En desarrollo');
  assert.equal(assignLevel('madurezDigital', 7.81), 'Avanzado');
});

test('computeSectorTargets advanced_min refleja inicio de Avanzado por dimensión', () => {
  const t = computeSectorTargets({ method: 'advanced_min' });
  assert.ok(t && typeof t === 'object');
  assert.equal(t.method, 'advanced_min');
  // Verifica perDimension coincide con "desde" de Avanzado en baremos.json
  for (const [dim, ranges] of Object.entries(baremos.general)) {
    const adv = ranges.find(r => (r.nivel || '').toLowerCase().includes('avanz'));
    if (adv) {
      assert.equal(t.perDimension[dim], adv.desde);
    }
  }
  assert.ok(Number.isFinite(t.global));
  assert.ok(t.global > 0 && t.global <= 10);
});
