import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import { validateData } from '../src/scripts/services/validator.js';

const dir = path.join(process.cwd(), 'src', 'data', 'individual');

test('individual JSON cumple el esquema', async (t) => {
  if (!fs.existsSync(dir)) {
    t.skip('no hay carpeta src/data/individual');
    return;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    t.skip('no hay JSONs individuales para validar');
    return;
  }
  const sample = path.join(dir, files[0]);
  const raw = fs.readFileSync(sample, 'utf8');
  const data = JSON.parse(raw);
  assert.doesNotThrow(() => validateData(data, 'individual'));
});

