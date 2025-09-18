import test from 'node:test';
import assert from 'node:assert/strict';

import { performQuantitativeAnalysis } from '../src/scripts/services/csv-processor.js';

test('performQuantitativeAnalysis calcula promedios por dimensión/subdimensión', () => {
  const mappings = {
    Q1: { dimension: 'madurezDigital', subDimension: 'adaptabilidad' },
    Q2: { dimension: 'madurezDigital', subDimension: 'adaptabilidad' },
    Q3: { dimension: 'madurezDigital', subDimension: 'proactividadDigital' },
    Q4: { dimension: 'brechaDigital', subDimension: 'analisisDeDatos' },
  };

  const data = [
    { Q1: '4', Q2: '2', Q3: '3', Q4: '1' },
    { Q1: '2', Q2: '2', Q3: '1', Q4: '4' },
    { Q1: '3', Q2: '3', Q3: '2', Q4: '3' },
  ];

  const res = performQuantitativeAnalysis(data, mappings);

  // adaptabilidad: valores = [4,2,2,2,3,3] / pero en nuestra construcción Q1 y Q2 por fila -> [4,2] y [2,2] y [3,3] => promedio = (4+2+2+2+3+3)/6 = 16/6 ≈ 2.6667
  assert.ok(res.madurezDigital, 'Debe existir madurezDigital');
  assert.ok(res.brechaDigital, 'Debe existir brechaDigital');
  assert.equal(Number(res.madurezDigital.adaptabilidad.toFixed(2)), 2.67);
  assert.equal(res.madurezDigital.proactividadDigital, 2);
  assert.equal(Number(res.brechaDigital.analisisDeDatos.toFixed(2)), 2.67);
});

