import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { generateReportJson } from '../src/scripts/services/report-builder.js';

function project(output) {
  return {
    header: {
      empresa: output.header.empresa,
      idReporte: output.header.idReporte,
      provider: output.header.provider,
    },
    resumenEjecutivo: {
      puntuacionGeneral: output.resumenEjecutivo.puntuacionGeneral.puntuacion,
      puntuacionesDimensiones: output.resumenEjecutivo.puntuacionesDimensiones.map(d => ({ nombre: d.nombre, puntuacion: d.puntuacion })),
    },
    madurezDigital: {
      componentes: output.madurezDigital.componentes.map(c => ({ nombre: c.nombre, puntuacion: c.puntuacion })),
    },
    competenciasDigitales: {
      competencias: output.competenciasDigitales.competencias.map(c => ({ name: c.name, score: c.score })),
    },
    usoInteligenciaArtificial: {
      graficos: output.usoInteligenciaArtificial.graficos.map(g => ({ titulo: g.titulo, porcentaje: g.porcentaje })),
    },
    culturaOrganizacional: {
      tarjetas: output.culturaOrganizacional.tarjetas.map(t => ({ titulo: t.titulo, puntuacion: t.puntuacion })),
    },
  };
}

test('snapshot del JSON final (proyección estable)', () => {
  const analysisResults = {
    madurezDigital: { adaptabilidad: 3.0, resolucionDeProblemas: 2.8, proactividadDigital: 2.4 },
    brechaDigital: { analisisDeDatos: 3.2, alfabetizacionDeDatos: 3.0, colaboracionDigital: 2.6, ciberseguridad: 3.0 },
    usoInteligenciaArtificial: { interesEnAprendizaje: 3.4, nivelDeAdopcion: 3.1, frecuenciaDeUso: 3.0, habilidadDeUso: 3.2, percepcionDeRiesgo: 2.4, eticaYVerificacion: 3.2 },
    culturaOrganizacional: { liderazgoYVision: 2.8, ambienteDeAprendizaje: 2.7, apoyoOrganizacional: 2.6, experimentacion: 2.9, reconocimiento: 2.7 },
  };

  const qualitativeResults = {
    resumenEjecutivo: { resumenGeneral: 'OK', fortalezas: [], oportunidades: [] },
    introduccion: 'Intro IA',
    brechaDigital: { textoNivelActual: 'Nivel', textoOportunidadParrafo: 'Oport.' },
    madurezDigital: { parrafoIntroductorio: 'Intro Madurez', componentes: [] },
    competenciasDigitales: { nivelDesarrollo: 'Nivel', descripcionPromedio: 'Desc', competencias: [] },
    usoInteligenciaArtificial: { resumen: 'Resumen', graficos: [] },
    culturaOrganizacional: { insights: { resumen: 'Resumen', puntos: [] }, tarjetas: [] },
    planAccion: { resumenGeneral: 'Resumen', iniciativas: [] },
  };

  const out = generateReportJson(analysisResults, qualitativeResults, 100, 'EmpresaX', 'RPT-001', 'gemini', 'gemini-2.5-pro');
  const proj = project(out);

  const snapshotPath = new URL('./__snapshots__/report.projection.snapshot.json', import.meta.url);
  const expected = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  assert.deepEqual(proj, expected);
});
