import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

// Calculates per-question, per-subdimension and per-dimension averages, scaled to 0–10 and rounded.
async function main() {
  const SCALE_FACTOR = 2.5;
  const round = (value) => Math.round(value * 100) / 100;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, '..', '..');

  const csvPath = path.join(projectRoot, 'data', 'respuestas-por-puntos.csv');
  const mappingPath = path.join(projectRoot, 'src', 'scripts', 'mappings.json');
  const outputPath = path.join(projectRoot, 'data', 'averages.json');

  const [csvContent, mappingContent] = await Promise.all([
    readFile(csvPath, 'utf8'),
    readFile(mappingPath, 'utf8')
  ]);

  const mapping = JSON.parse(mappingContent);

  const parsed = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length) {
    const message = parsed.errors.map(err => `${err.type} at row ${err.row}: ${err.message}`).join('\n');
    throw new Error(`Error parsing CSV:\n${message}`);
  }

  const rows = parsed.data;

  const questionStats = new Map();
  const dimensionStats = new Map();
  const subDimensionStats = new Map();

  for (const [question, meta] of Object.entries(mapping)) {
    questionStats.set(question, { sum: 0, count: 0 });

    if (!dimensionStats.has(meta.dimension)) {
      dimensionStats.set(meta.dimension, { sum: 0, count: 0 });
    }

    if (!subDimensionStats.has(meta.dimension)) {
      subDimensionStats.set(meta.dimension, new Map());
    }

    const subMap = subDimensionStats.get(meta.dimension);
    if (!subMap.has(meta.subDimension)) {
      subMap.set(meta.subDimension, { sum: 0, count: 0 });
    }
  }

  for (const row of rows) {
    for (const [question, meta] of Object.entries(mapping)) {
      if (!(question in row)) continue;
      const rawValue = row[question];
      const value = typeof rawValue === 'number' ? rawValue : Number.parseFloat(rawValue);

      if (!Number.isFinite(value)) continue;

      const qStats = questionStats.get(question);
      qStats.sum += value;
      qStats.count += 1;

      const dStats = dimensionStats.get(meta.dimension);
      dStats.sum += value;
      dStats.count += 1;

      const subMap = subDimensionStats.get(meta.dimension);
      const subStats = subMap.get(meta.subDimension);
      subStats.sum += value;
      subStats.count += 1;
    }
  }

  const questionAverages = Object.fromEntries(
    [...questionStats.entries()]
      .map(([question, { sum, count }]) => [
        question,
        count ? round((sum / count) * SCALE_FACTOR) : null
      ])
      .filter(([, average]) => average !== null)
  );

  const dimensionAverages = Object.fromEntries(
    [...dimensionStats.entries()].map(([dimension, { sum, count }]) => [
      dimension,
      count ? round((sum / count) * SCALE_FACTOR) : null
    ])
  );

  const subDimensionAverages = Object.fromEntries(
    [...subDimensionStats.entries()].map(([dimension, subMap]) => {
      const subEntries = [...subMap.entries()].map(([subDimension, { sum, count }]) => [
        subDimension,
        count ? round((sum / count) * SCALE_FACTOR) : null
      ]);
      return [dimension, Object.fromEntries(subEntries)];
    })
  );

  const result = {
    questionAverages,
    dimensionAverages,
    subDimensionAverages
  };

  await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Averages saved to ${path.relative(projectRoot, outputPath)}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
