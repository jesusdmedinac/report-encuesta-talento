import fs from 'fs';
import path from 'path';

const ANALYSIS_MD_PATH = path.join(process.cwd(), 'analisis', 'ANALISIS.md');
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'src', 'data', 'analysisScores.json');

function extractNumber(markdown, regex, label) {
  const match = markdown.match(regex);
  if (!match) {
    throw new Error(`No se pudo extraer ${label}`);
  }
  const raw = match[1].replace(',', '.');
  return parseFloat(raw);
}

function buildAnalysisJson(markdown) {
  const sampleSize = extractNumber(
    markdown,
    /([0-9]{3,}) participantes del Banco Guayaquil/,
    'el tamaño de muestra'
  );

  const globalScore10 = extractNumber(
    markdown,
    /Índice Global de\s+([0-9]+(?:\.[0-9]+)?)/,
    'el índice global'
  );

  const dimensionPatterns = {
    madurezDigital: /\*\*D1\s*-\s*Madurez Digital y Adaptabilidad\*\*: Media de \*\*([0-9]+(?:\.[0-9]+)?) puntos\*\*/i,
    brechaDigital: /\*\*D2\s*-\s*Brecha de Competencias Digitales\*\*: Lidera con \*\*([0-9]+(?:\.[0-9]+)?) puntos\*\*/i,
    usoInteligenciaArtificial: /\*\*D4\s*-\s*Adopción de IA\*\*: Registra \*\*([0-9]+(?:\.[0-9]+)?) puntos\*\*/i,
    culturaOrganizacional: /\*\*D3\s*-\s*Cultura Tecnológica y Liderazgo\*\*: Presenta la puntuación más baja[^*]*\*\*([0-9]+(?:\.[0-9]+)?) puntos\*\*/i,
  };

  const dimensions = Object.fromEntries(
    Object.entries(dimensionPatterns).map(([key, regex]) => {
      const value10 = extractNumber(markdown, regex, `la puntuación de ${key}`);
      const value4 = parseFloat((value10 / 2.5).toFixed(4));
      return [key, { score10: value10, score4: value4 }];
    })
  );

  const modulePatterns = {
    rolMandosMedios: /\*\*M2\s*-\s*Mandos Medios\*\*[^*]*\*\*([0-9]+(?:\.[0-9]+)?) puntos\*\*/i,
    rolLiderazgo: /\*\*M1\s*-\s*Liderazgo\*\*:\s*([0-9]+(?:\.[0-9]+)?) puntos/i,
    rolTecnicoProducto: /\*\*M5\s*-\s*Técnico\/Producto\*\*:\s*([0-9]+(?:\.[0-9]+)?) puntos/i,
    rolSoporteInterno: /\*\*M6\s*-\s*Soporte Interno \(RRHH\/Legal\)\*\*:\s*([0-9]+(?:\.[0-9]+)?) puntos/i,
    rolOperacionesAdminFinanzas: /\*\*M4\s*-\s*Operaciones\/Finanzas\*\*:\s*([0-9]+(?:\.[0-9]+)?) puntos/i,
    rolComercialCliente: /\*\*M3\s*-\s*Comercial\/Cliente\*\*:[^0-9]*([0-9]+(?:\.[0-9]+)?) puntos/i,
  };

  const roleModules = Object.fromEntries(
    Object.entries(modulePatterns).map(([key, regex]) => {
      const value10 = extractNumber(markdown, regex, `la puntuación de ${key}`);
      const value4 = parseFloat((value10 / 2.5).toFixed(4));
      return [key, { score10: value10, score4: value4 }];
    })
  );

  const benchmark = extractNumber(
    markdown,
    /M\s+Otros\s*=\s*([0-9]+(?:\.[0-9]+)?)/,
    'el promedio del sector'
  );

  return {
    source: 'analisis/ANALISIS.md',
    generatedAt: new Date().toISOString(),
    sampleSize,
    global: {
      score10: globalScore10,
      score4: parseFloat((globalScore10 / 2.5).toFixed(4))
    },
    dimensions,
    roleModules,
    sectorReference: {
      globalMean10: benchmark,
      globalMean4: parseFloat((benchmark / 2.5).toFixed(4))
    }
  };
}

function main() {
  const markdown = fs.readFileSync(ANALYSIS_MD_PATH, 'utf8');
  const analysisJson = buildAnalysisJson(markdown);
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(analysisJson, null, 2), 'utf8');
  console.log(`✅ Archivo generado en ${OUTPUT_JSON_PATH}`);
}

main();
